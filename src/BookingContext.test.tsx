import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BookingProvider, useBookings } from './contexts/BookingContext';

// Mock Supabase client
vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock AuthProvider
vi.mock('./contexts/AuthProvider', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    profile: { role: 'tourist' }
  })
}));

// Mock Chakra UI toast
vi.mock('@chakra-ui/react', () => ({
  useToast: () => vi.fn()
}));

describe('BookingContext - hasCompletedGuideBooking', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    maybeSingle: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn()
    };
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BookingProvider>{children}</BookingProvider>
  );

  it('should return true when user has completed booking with guide', async () => {
    // Mock successful query with data
    mockSupabase.maybeSingle.mockResolvedValue({
      data: { id: 'booking-id' },
      error: null
    });

    vi.doMock('./lib/supabaseClient', () => ({
      supabase: mockSupabase
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });
    
    const hasCompleted = await result.current.hasCompletedGuideBooking('guide-id');
    expect(hasCompleted).toBe(true);
  });

  it('should return false when user has not completed booking with guide', async () => {
    // Mock successful query with no data
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    });

    vi.doMock('./lib/supabaseClient', () => ({
      supabase: mockSupabase
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });
    
    const hasCompleted = await result.current.hasCompletedGuideBooking('guide-id');
    expect(hasCompleted).toBe(false);
  });

  it('should return false when database error occurs', async () => {
    // Mock database error
    mockSupabase.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'Table does not exist' }
    });

    vi.doMock('./lib/supabaseClient', () => ({
      supabase: mockSupabase
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });
    
    const hasCompleted = await result.current.hasCompletedGuideBooking('guide-id');
    expect(hasCompleted).toBe(false);
  });

  it('should return false when exception is thrown', async () => {
    // Mock exception
    mockSupabase.maybeSingle.mockRejectedValue(new Error('Network error'));

    vi.doMock('./lib/supabaseClient', () => ({
      supabase: mockSupabase
    }));

    const { result } = renderHook(() => useBookings(), { wrapper });
    
    const hasCompleted = await result.current.hasCompletedGuideBooking('guide-id');
    expect(hasCompleted).toBe(false);
  });

  it('should return false when user or guideId is missing', async () => {
    const { result } = renderHook(() => useBookings(), { wrapper });
    
    // Test with empty guideId
    const hasCompleted1 = await result.current.hasCompletedGuideBooking('');
    expect(hasCompleted1).toBe(false);
    
    // Test with null/undefined guideId
    const hasCompleted2 = await result.current.hasCompletedGuideBooking(null as unknown as string);
    expect(hasCompleted2).toBe(false);
  });
});