// Test helper for notifications functionality
export const createMockNotification = (type: string, isRead: boolean = false) => {
  const baseNotification = {
    id: `notification-${Date.now()}`,
    type,
    actor_id: 'actor-123',
    recipient_id: 'recipient-456',
    target_type: 'booking',
    target_id: 'target-789',
    is_read: isRead,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    actor: {
      id: 'actor-123',
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg'
    }
  };

  switch (type) {
    case 'booking_created':
      return {
        ...baseNotification,
        message: "John Doe booked 'Svaneti Highlights' for Aug 12",
        action_url: "/dashboard/my-bookings"
      };
    case 'booking_paid':
      return {
        ...baseNotification,
        message: "John Doe paid $150 for your tour",
        action_url: "/dashboard/my-bookings"
      };
    case 'tour_rated':
      return {
        ...baseNotification,
        message: "John Doe rated your tour 5 stars",
        action_url: null // Rating notifications should NOT include jump action
      };
    case 'tour_updated':
      return {
        ...baseNotification,
        message: "Tour 'Svaneti Highlights' has been updated",
        action_url: "/tours/target-789"
      };
    case 'tour_cancelled':
      return {
        ...baseNotification,
        message: "Tour 'Svaneti Highlights' has been cancelled",
        action_url: "/dashboard/my-bookings"
      };
    default:
      return baseNotification;
  }
};

// Example notification schema (as requested in requirements)
export const exampleNotificationSchema = {
  id: "notification-123",
  type: "booking_created", 
  actor: { id: "user-456", name: "Anna" },
  target: { type: "booking", id: "booking-789" },
  message: "Anna booked 'Svaneti Highlights' for Aug 12",
  actionUrl: "/dashboard/my-bookings",
  createdAt: "2025-08-27T12:00:00Z",
  isRead: false
};

// Test cases for notifications
export const notificationTestCases = [
  {
    name: "Tourist booked tour (guide notification)",
    type: "booking_created",
    recipient: "guide",
    expected: {
      hasActionUrl: true,
      actionUrl: "/dashboard/my-bookings",
      message: "includes who booked + tour title"
    }
  },
  {
    name: "Tourist paid for tour (guide notification)", 
    type: "booking_paid",
    recipient: "guide",
    expected: {
      hasActionUrl: true,
      actionUrl: "/dashboard/my-bookings",
      message: "includes who + amount"
    }
  },
  {
    name: "Tourist rated tour (guide notification)",
    type: "tour_rated", 
    recipient: "guide",
    expected: {
      hasActionUrl: false, // Must NOT include jump action
      actionUrl: null,
      message: "includes who rated + rating value + comment"
    }
  },
  {
    name: "Tour updated (tourist notification)",
    type: "tour_updated",
    recipient: "tourist", 
    expected: {
      hasActionUrl: true,
      actionUrl: "/tours/tour-id",
      message: "tour updated notification"
    }
  },
  {
    name: "Tour cancelled (tourist notification)",
    type: "tour_cancelled",
    recipient: "tourist",
    expected: {
      hasActionUrl: true, 
      actionUrl: "/dashboard/my-bookings",
      message: "tour cancelled notification"
    }
  }
];

// Helper to create notification with specific event types
export const createNotificationByEvent = (event: string, actorName: string, targetName: string, additionalData?: any) => {
  const eventMap: Record<string, any> = {
    'tourist_booked_tour': {
      type: 'booking_created',
      message: `${actorName} booked '${targetName}' for ${additionalData?.date || 'a tour'}`,
      actionUrl: '/dashboard/my-bookings'
    },
    'tourist_paid_tour': {
      type: 'booking_paid', 
      message: `${actorName} paid ${additionalData?.amount || '$0'} for your tour`,
      actionUrl: '/dashboard/my-bookings'
    },
    'tourist_rated_tour': {
      type: 'tour_rated',
      message: `${actorName} rated your tour ${additionalData?.rating || '5'} stars`,
      actionUrl: null // Must NOT include jump action
    },
    'tour_updated': {
      type: 'tour_updated',
      message: `Tour '${targetName}' has been updated`, 
      actionUrl: `/tours/${additionalData?.tourId || 'tour-id'}`
    },
    'tour_cancelled': {
      type: 'tour_cancelled',
      message: `Tour '${targetName}' has been cancelled`,
      actionUrl: '/dashboard/my-bookings'
    }
  };

  return eventMap[event] || { type: 'unknown', message: 'Unknown notification', actionUrl: null };
};