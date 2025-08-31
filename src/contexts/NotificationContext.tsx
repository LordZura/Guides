import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { useToast } from '@chakra-ui/react';
import { retrySupabaseQuery } from '../utils/supabaseRetry';

export type NotificationType = 'booking_created' | 'booking_paid' | 'booking_completed' | 'tour_rated' | 'tour_updated' | 'tour_cancelled';

export interface NotificationActor {
  id: string;
  name: string;
  avatar?: string;
}

export interface NotificationTarget {
  type: 'booking' | 'tour' | 'user';
  id: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  actor_id: string;
  recipient_id: string;
  target_type: string;
  target_id: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  actor?: NotificationActor;
  target?: NotificationTarget;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (_notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  createNotification: (_notificationData: Partial<Notification>) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification message templates
const getNotificationMessage = (
  type: NotificationType, 
  actorName: string, 
  targetName?: string,
  additionalData?: any
): string => {
  switch (type) {
    case 'booking_created':
      return `${actorName} booked '${targetName}' for ${additionalData?.date || 'a tour'}`;
    case 'booking_paid':
      return `${actorName} paid ${additionalData?.amount || '$0'} for your tour`;
    case 'booking_completed':
      return `Tour '${targetName}' with ${actorName} has been completed`;
    case 'tour_rated':
      return `${actorName} rated your tour ${additionalData?.rating || '5'} stars`;
    case 'tour_updated':
      return `Tour '${targetName}' has been updated`;
    case 'tour_cancelled':
      return `Tour '${targetName}' has been cancelled`;
    default:
      return `You have a new notification from ${actorName}`;
  }
};

// Action URL templates
const getActionUrl = (type: NotificationType, targetId: string): string | null => {
  switch (type) {
    case 'booking_created':
    case 'booking_paid':
      return '/dashboard/my-bookings';
    case 'booking_completed':
      return `/tours/${targetId}`;
    case 'tour_rated':
      // Rating notifications should NOT include jump action (as per requirements)
      return null;
    case 'tour_updated':
      return `/tours/${targetId}`;
    case 'tour_cancelled':
      return '/dashboard/my-bookings';
    default:
      return null;
  }
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Fetch notifications when user changes
  useEffect(() => {
    if (user) {
      refreshNotifications();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [user]);

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public', 
        table: 'notifications',
        filter: `recipient_id=eq.${user.id}`
      }, (_payload) => {
        // Refresh notifications when any change occurs
        refreshNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const refreshNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First fetch notifications without joins
      const { data: notificationsData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to recent 50 notifications

      if (fetchError) {
        console.warn('Unable to fetch notifications:', fetchError.message);
        setNotifications([]);
        return;
      }

      // Get unique actor IDs
      const actorIds = [...new Set(notificationsData?.map(n => n.actor_id).filter(Boolean))];
      
      // Fetch profile data for all actors with retry mechanism
      let actorProfiles: { [key: string]: any } = {};
      if (actorIds.length > 0) {
        const profileResult = await retrySupabaseQuery(async () => {
          return await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', actorIds);
        });

        if (!profileResult.error && profileResult.data) {
          profileResult.data.forEach(profile => {
            actorProfiles[profile.id] = profile;
          });
        } else if (profileResult.error) {
          console.warn('Error fetching actor profiles:', profileResult.error);
        }
      }

      // Transform the data to match the expected format
      const transformedData = notificationsData?.map(notification => ({
        ...notification,
        actor: notification.actor_id && actorProfiles[notification.actor_id] ? {
          id: actorProfiles[notification.actor_id].id,
          name: actorProfiles[notification.actor_id].full_name,
          avatar: actorProfiles[notification.actor_id].avatar_url
        } : undefined
      })) || [];

      setNotifications(transformedData);
    } catch (err: any) {
      console.warn('Error fetching notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id); // Security check

      if (error) {
        console.warn('Unable to mark notification as read:', error.message);
        return false;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );

      return true;
    } catch (err) {
      console.warn('Error marking notification as read:', err);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return true;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.warn('Unable to mark all notifications as read:', error.message);
        return false;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );

      toast({
        title: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      return true;
    } catch (err) {
      console.warn('Error marking all notifications as read:', err);
      return false;
    }
  };

  const createNotification = async (notificationData: Partial<Notification>): Promise<boolean> => {
    if (!notificationData.type || !notificationData.actor_id || !notificationData.recipient_id || !notificationData.target_id) {
      console.warn('Missing required notification data');
      return false;
    }

    try {
      // Don't create notification if actor and recipient are the same
      if (notificationData.actor_id === notificationData.recipient_id) {
        return true;
      }

      // Get actor info for message generation
      const { data: actorData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', notificationData.actor_id)
        .single();

      const actorName = actorData?.full_name || 'Someone';
      
      const finalNotificationData = {
        ...notificationData,
        message: notificationData.message || getNotificationMessage(
          notificationData.type as NotificationType, 
          actorName, 
          notificationData.target_id,
          notificationData
        ),
        action_url: notificationData.action_url || getActionUrl(
          notificationData.type as NotificationType, 
          notificationData.target_id
        ),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notifications')
        .insert(finalNotificationData);

      if (error) {
        console.warn('Unable to create notification:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('Error creating notification:', err);
      return false;
    }
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    createNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};