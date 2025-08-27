// Utility to test notification functionality without requiring external dependencies
import { Notification } from '../contexts/NotificationContext';

// Mock data for testing notifications locally
export const createMockNotification = (type: string, overrides: Partial<Notification> = {}): Notification => {
  const baseId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const defaultNotification: Notification = {
    id: baseId,
    type: type as any,
    actor_id: 'mock-actor-id',
    recipient_id: 'mock-recipient-id',
    target_type: 'booking',
    target_id: 'mock-target-id',
    message: '',
    action_url: null,
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    actor: {
      id: 'mock-actor-id',
      name: 'Test User',
      avatar: undefined
    }
  };

  // Set type-specific defaults
  switch (type) {
    case 'booking_created':
      defaultNotification.message = "Test User booked 'Sample Tour' for Jan 15";
      defaultNotification.action_url = '/dashboard/my-bookings';
      break;
    case 'booking_paid':
      defaultNotification.message = "Test User paid $150 for your tour";
      defaultNotification.action_url = '/dashboard/my-bookings';
      break;
    case 'tour_rated':
      defaultNotification.message = "Test User rated your tour 5 stars";
      defaultNotification.action_url = null;
      break;
    case 'tour_updated':
      defaultNotification.message = "Tour 'Sample Tour' has been updated";
      defaultNotification.action_url = '/tours/mock-target-id';
      break;
    case 'tour_cancelled':
      defaultNotification.message = "Tour 'Sample Tour' has been cancelled";
      defaultNotification.action_url = '/dashboard/my-bookings';
      break;
    default:
      defaultNotification.message = `Test notification of type: ${type}`;
  }

  return { ...defaultNotification, ...overrides };
};

// Create a set of test notifications
export const createTestNotifications = (): Notification[] => {
  return [
    createMockNotification('booking_created', { is_read: false }),
    createMockNotification('booking_paid', { 
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }),
    createMockNotification('tour_rated', { 
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }),
    createMockNotification('tour_updated', { 
      is_read: false,
      created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
    }),
    createMockNotification('tour_cancelled', { 
      is_read: true,
      created_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    })
  ];
};

// Test the notification creation logic
export const testNotificationCreation = () => {
  const notifications = createTestNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  
  console.log('🔔 Notification Test Results:');
  console.log(`Total notifications: ${notifications.length}`);
  console.log(`Unread notifications: ${unreadCount}`);
  console.log('Notifications:');
  notifications.forEach((n, i) => {
    console.log(`  ${i + 1}. [${n.is_read ? 'READ' : 'UNREAD'}] ${n.type}: ${n.message}`);
    console.log(`     Action URL: ${n.action_url || 'None'}`);
    console.log(`     Created: ${new Date(n.created_at).toLocaleString()}`);
  });
  
  return { notifications, unreadCount };
};