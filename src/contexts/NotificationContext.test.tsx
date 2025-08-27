import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications, NotificationProvider } from '../contexts/NotificationContext';
import { supabase } from '../lib/supabaseClient';

// Mock the supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              // Mock successful response for notifications
              data: [
                {
                  id: 'test-notification-1',
                  type: 'booking_created',
                  actor_id: 'test-actor-1',
                  recipient_id: 'test-recipient-1',
                  target_type: 'booking',
                  target_id: 'test-booking-1',
                  message: 'Test notification',
                  action_url: '/test',
                  is_read: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      in: vi.fn(() => ({
        // Mock successful response for profiles
        data: [
          {
            id: 'test-actor-1',
            full_name: 'Test Actor',
            avatar_url: 'https://example.com/avatar.jpg'
          }
        ],
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      }))
    }))
  }
}));

// Mock useAuth
vi.mock('../contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-1' }
  })
}));

// Mock useToast
vi.mock('@chakra-ui/react', () => ({
  useToast: () => vi.fn()
}));

describe('NotificationContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <NotificationProvider>{children}</NotificationProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications with actor profiles successfully', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    // Wait for the notifications to be loaded
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that notifications were fetched and transformed correctly
    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0]).toMatchObject({
      id: 'test-notification-1',
      type: 'booking_created',
      message: 'Test notification',
      actor: {
        id: 'test-actor-1',
        name: 'Test Actor',
        avatar: 'https://example.com/avatar.jpg'
      }
    });
  });

  it('should handle marking notification as read', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const success = await result.current.markAsRead('test-notification-1');
    expect(success).toBe(true);
  });

  it('should handle marking all notifications as read', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const success = await result.current.markAllAsRead();
    expect(success).toBe(true);
  });

  it('should create notification successfully', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const success = await result.current.createNotification({
      type: 'booking_created',
      actor_id: 'test-actor-2',
      recipient_id: 'test-recipient-2',
      target_type: 'booking',
      target_id: 'test-booking-2'
    });

    expect(success).toBe(true);
  });
});