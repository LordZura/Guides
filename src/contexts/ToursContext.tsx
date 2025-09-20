import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { useToast } from '@chakra-ui/react';
import { useNotifications } from './NotificationContext';

export interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
  creator_id: string;
  creator_role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ToursContextType {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  refreshTours: () => Promise<void>;
  deleteTour: (_tourId: string) => Promise<void>;
  updateTourStatus: (tourId: string, isActive: boolean) => Promise<void>;
  updateTour: (tourId: string, updates: Partial<Tour>) => Promise<void>;
}

const ToursContext = createContext<ToursContextType | undefined>(undefined);

export const ToursProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const { createNotification } = useNotifications();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchTours = async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch tours created by the current user
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTours(data || []);
    } catch (err) {
      console.error('Error fetching tours:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tours');
      toast({
        title: 'Error loading tours',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [profile]);

  const refreshTours = async () => {
    await fetchTours();
  };

  const deleteTour = async (id: string) => {
    try {
      // First get the tour details and find all tourists with active bookings
      const { data: tourData } = await supabase
        .from('tours')
        .select('title')
        .eq('id', id)
        .single();

      const { data: bookings } = await supabase
        .from('bookings')
        .select('tourist_id')
        .eq('tour_id', id)
        .in('status', ['requested', 'accepted', 'paid']); // Active bookings

      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify all tourists with active bookings about tour cancellation
      if (bookings && profile) {
        for (const booking of bookings) {
          try {
            await createNotification({
              type: 'tour_cancelled',
              actor_id: profile.id,
              recipient_id: booking.tourist_id,
              target_type: 'tour',
              target_id: id,
              message: `Tour '${tourData?.title || 'Unknown Tour'}' has been cancelled`,
              action_url: '/dashboard/my-bookings'
            });
          } catch (notificationError) {
            console.warn('Failed to create tour cancellation notification:', notificationError);
          }
        }
      }
      
      // Update local state
      setTours(tours.filter(tour => tour.id !== id));
      
      toast({
        title: 'Tour deleted',
        description: 'The tour has been successfully deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error deleting tour:', err);
      toast({
        title: 'Error deleting tour',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateTourStatus = async (id: string, isActive: boolean) => {
    try {
      // If deactivating, get tour details and notify tourists with active bookings
      let tourData = null;
      let bookings = null;
      
      if (!isActive) {
        const { data: tourDetails } = await supabase
          .from('tours')
          .select('title')
          .eq('id', id)
          .single();
        tourData = tourDetails;

        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('tourist_id')
          .eq('tour_id', id)
          .in('status', ['requested', 'accepted', 'paid']); // Active bookings
        bookings = activeBookings;
      }

      const { error } = await supabase
        .from('tours')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify tourists if tour is being deactivated
      if (!isActive && bookings && profile) {
        for (const booking of bookings) {
          try {
            await createNotification({
              type: 'tour_cancelled',
              actor_id: profile.id,
              recipient_id: booking.tourist_id,
              target_type: 'tour',
              target_id: id,
              message: `Tour '${tourData?.title || 'Unknown Tour'}' has been cancelled`,
              action_url: '/dashboard/my-bookings'
            });
          } catch (notificationError) {
            console.warn('Failed to create tour deactivation notification:', notificationError);
          }
        }
      }
      
      // Update local state
      setTours(tours.map(tour => 
        tour.id === id ? { ...tour, is_active: isActive } : tour
      ));
      
      toast({
        title: `Tour ${isActive ? 'activated' : 'deactivated'}`,
        description: `The tour is now ${isActive ? 'visible to users' : 'hidden from users'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error updating tour status:', err);
      toast({
        title: 'Error updating tour',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateTour = async (id: string, updates: Partial<Tour>) => {
    try {
      // Get current tour details
      const { data: currentTour } = await supabase
        .from('tours')
        .select('title')
        .eq('id', id)
        .single();

      // Get tourists with active bookings for this tour
      const { data: bookings } = await supabase
        .from('bookings')
        .select('tourist_id')
        .eq('tour_id', id)
        .in('status', ['requested', 'accepted', 'paid']); // Active bookings

      const { error } = await supabase
        .from('tours')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Notify tourists with active bookings about tour update
      if (bookings && profile) {
        for (const booking of bookings) {
          try {
            await createNotification({
              type: 'tour_updated',
              actor_id: profile.id,
              recipient_id: booking.tourist_id,
              target_type: 'tour',
              target_id: id,
              message: `Tour '${currentTour?.title || 'Unknown Tour'}' has been updated`,
              action_url: `/tours/${id}`
            });
          } catch (notificationError) {
            console.warn('Failed to create tour update notification:', notificationError);
          }
        }
      }
      
      // Update local state
      setTours(tours.map(tour => 
        tour.id === id ? { ...tour, ...updates, updated_at: new Date().toISOString() } : tour
      ));
      
      toast({
        title: 'Tour updated',
        description: 'The tour has been successfully updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error updating tour:', err);
      toast({
        title: 'Error updating tour',
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const value = {
    tours,
    isLoading,
    error,
    refreshTours,
    deleteTour,
    updateTourStatus,
    updateTour,
  };

  return <ToursContext.Provider value={value}>{children}</ToursContext.Provider>;
};

export const useTours = () => {
  const context = useContext(ToursContext);
  if (context === undefined) {
    throw new Error('useTours must be used within a ToursProvider');
  }
  return context;
};