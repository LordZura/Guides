import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BookingProvider, useBookings } from './contexts/BookingContext';

// Mock Supabase client
const mockSupabaseUpdate = vi.fn();
const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
  update: mockSupabaseUpdate,
  eq: vi.fn().mockReturnThis(),
  single: vi.fn()
}));

vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    from: mockSupabaseFrom
  }
}));

// Mock AuthProvider with tourist user
vi.mock('./contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'tourist-123' },
    profile: { role: 'tourist' }
  })
}));

// Mock NotificationContext
vi.mock('./contexts/NotificationContext', () => ({
  useNotifications: () => ({
    createNotification: vi.fn()
  })
}));

// Mock Chakra UI toast
vi.mock('@chakra-ui/react', () => ({
  useToast: () => vi.fn()
}));

describe('Booking Context - Offered Booking Acceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock implementations
    mockSupabaseSelect.mockReturnThis();
    mockSupabaseUpdate.mockReturnThis();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BookingProvider>{children}</BookingProvider>
  );

  it('should allow tourist to accept an offered booking', async () => {
    // Mock the booking verification query - return an offered booking for this tourist
    mockSupabaseSelect.mockImplementation((fields) => {
      if (fields === '*') {
        return {
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'booking-123',
              status: 'offered',
              tourist_id: 'tourist-123', // Current user is the tourist
              guide_id: 'guide-456',
              tour_id: 'tour-789'
            },
            error: null
          })
        };
      }
      return mockSupabaseSelect;
    });

    // Mock the update query - should succeed
    mockSupabaseUpdate.mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({
        error: null
      })
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });

    // Test accepting an offered booking
    const success = await result.current.updateBookingStatus('booking-123', 'accepted');

    await waitFor(() => {
      expect(success).toBe(true);
    });

    // Verify the correct Supabase calls were made
    expect(mockSupabaseFrom).toHaveBeenCalledWith('bookings');
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ status: 'accepted' });
  });

  it('should fail when tourist tries to accept booking not offered to them', async () => {
    // Mock the booking verification query - return an offered booking for a different tourist
    mockSupabaseSelect.mockImplementation((fields) => {
      if (fields === '*') {
        return {
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'booking-123',
              status: 'offered',
              tourist_id: 'different-tourist-999', // Different tourist
              guide_id: 'guide-456',
              tour_id: 'tour-789'
            },
            error: null
          })
        };
      }
      return mockSupabaseSelect;
    });

    const { result } = renderHook(() => useBookings(), { wrapper });

    // Test accepting an offered booking not for current user
    const success = await result.current.updateBookingStatus('booking-123', 'accepted');

    await waitFor(() => {
      expect(success).toBe(false);
    });

    // Verify update was not called
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });

  it('should handle P0001 database error gracefully', async () => {
    // Mock the booking verification query - return valid offered booking
    mockSupabaseSelect.mockImplementation((fields) => {
      if (fields === '*') {
        return {
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'booking-123',
              status: 'offered',
              tourist_id: 'tourist-123',
              guide_id: 'guide-456',
              tour_id: 'tour-789'
            },
            error: null
          })
        };
      }
      return mockSupabaseSelect;
    });

    // Mock the update query to return P0001 error
    mockSupabaseUpdate.mockImplementation(() => ({
      eq: vi.fn().mockResolvedValue({
        error: {
          code: 'P0001',
          message: 'Tourist is not allowed to perform this update'
        }
      })
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });

    // Test handling of P0001 error
    const success = await result.current.updateBookingStatus('booking-123', 'accepted');

    await waitFor(() => {
      expect(success).toBe(false);
    });

    // Verify the update was attempted
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({ status: 'accepted' });
  });
});