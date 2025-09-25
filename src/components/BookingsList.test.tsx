import { describe, it, expect } from 'vitest';
import { Booking } from '../contexts/BookingContext';

describe('BookingsList Logic', () => {
  // Mock data
  const mockIncomingBookings: Booking[] = [
    {
      id: '1',
      tour_id: 'tour1',
      tourist_id: 'tourist1',
      guide_id: 'guide1',
      status: 'offered', // Guide offer to tourist
      party_size: 2,
      booking_date: '2024-01-15',
      preferred_time: '10:00',
      notes: null,
      total_price: 100,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    }
  ];

  const mockOutgoingBookings: Booking[] = [
    {
      id: '2',
      tour_id: 'tour2',
      tourist_id: 'tourist1',
      guide_id: 'guide2',
      status: 'requested', // Tourist request to guide
      party_size: 1,
      booking_date: '2024-01-20',
      preferred_time: '14:00',
      notes: null,
      total_price: 150,
      created_at: '2024-01-12T00:00:00Z',
      updated_at: '2024-01-12T00:00:00Z',
    }
  ];

  it('should show both incoming and outgoing bookings for tourists', () => {
    const isGuide = false; // Tourist
    
    // Simulate the logic from BookingsList.tsx
    const bookings = isGuide ? mockIncomingBookings : [...mockIncomingBookings, ...mockOutgoingBookings];
    
    // Tourists should see both types of bookings
    expect(bookings).toHaveLength(2);
    expect(bookings).toEqual(expect.arrayContaining(mockIncomingBookings));
    expect(bookings).toEqual(expect.arrayContaining(mockOutgoingBookings));
    
    // Check that offered bookings (guide offers) are included
    const offeredBookings = bookings.filter(b => b.status === 'offered');
    expect(offeredBookings).toHaveLength(1);
    expect(offeredBookings[0].id).toBe('1');
  });

  it('should show only incoming bookings for guides', () => {
    const isGuide = true; // Guide
    
    // Simulate the logic from BookingsList.tsx
    const bookings = isGuide ? mockIncomingBookings : [...mockIncomingBookings, ...mockOutgoingBookings];
    
    // Guides should only see incoming bookings (tourist requests)
    expect(bookings).toHaveLength(1);
    expect(bookings).toEqual(mockIncomingBookings);
  });

  it('should filter pending bookings correctly for tourists', () => {
    const isGuide = false; // Tourist
    const bookings = [...mockIncomingBookings, ...mockOutgoingBookings];
    
    // Filter logic from BookingsList.tsx
    const pendingBookings = bookings.filter(b => 
      b.status === 'requested' || 
      (b.status === 'offered' && !isGuide) // Tourists see offered bookings as pending
    );
    
    // Should include both 'requested' and 'offered' bookings for tourists
    expect(pendingBookings).toHaveLength(2);
    expect(pendingBookings.find(b => b.status === 'offered')).toBeDefined();
    expect(pendingBookings.find(b => b.status === 'requested')).toBeDefined();
  });

  it('should filter pending bookings correctly for guides', () => {
    const isGuide = true; // Guide  
    const bookings = mockIncomingBookings; // Guides only see incoming
    
    // Filter logic from BookingsList.tsx
    const pendingBookings = bookings.filter(b => 
      b.status === 'requested' || 
      (b.status === 'offered' && !isGuide) // Tourists see offered bookings as pending
    );
    
    // Guides should not see 'offered' bookings as pending (they created them)
    expect(pendingBookings).toHaveLength(0);
  });

  it('should show correct review modal header based on tour creator role', () => {
    // Test guide-created tour booking (should target tour)
    const guideCreatedTourBooking: Booking = {
      id: '3',
      tour_id: 'tour3',
      tourist_id: 'tourist1',
      guide_id: 'guide1',
      status: 'completed',
      party_size: 1,
      booking_date: '2024-01-15',
      preferred_time: '10:00',
      notes: null,
      total_price: 50,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      tour_creator_role: 'guide'
    };

    // Test tourist-created tour booking (should target guide)
    const touristCreatedTourBooking: Booking = {
      id: '4',
      tour_id: 'tour4',
      tourist_id: 'tourist1',
      guide_id: 'guide1',
      status: 'completed',
      party_size: 1,
      booking_date: '2024-01-15',
      preferred_time: '10:00',
      notes: null,
      total_price: 50,
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
      tour_creator_role: 'tourist'
    };

    // Test header logic for guide-created tour
    const guideCreatedHeader = guideCreatedTourBooking.tour_creator_role === 'guide' 
      ? 'Review This Tour' 
      : 'Review Your Guide';
    expect(guideCreatedHeader).toBe('Review This Tour');

    // Test header logic for tourist-created tour
    const touristCreatedHeader = touristCreatedTourBooking.tour_creator_role === 'guide' 
      ? 'Review This Tour' 
      : 'Review Your Guide';
    expect(touristCreatedHeader).toBe('Review Your Guide');

    // Test target selection for guide-created tour
    const guideCreatedTargetId = guideCreatedTourBooking.tour_creator_role === 'guide' 
      ? guideCreatedTourBooking.tour_id 
      : guideCreatedTourBooking.guide_id;
    const guideCreatedTargetType = guideCreatedTourBooking.tour_creator_role === 'guide' 
      ? 'tour' 
      : 'guide';
    expect(guideCreatedTargetId).toBe('tour3');
    expect(guideCreatedTargetType).toBe('tour');

    // Test target selection for tourist-created tour
    const touristCreatedTargetId = touristCreatedTourBooking.tour_creator_role === 'guide' 
      ? touristCreatedTourBooking.tour_id 
      : touristCreatedTourBooking.guide_id;
    const touristCreatedTargetType = touristCreatedTourBooking.tour_creator_role === 'guide' 
      ? 'tour' 
      : 'guide';
    expect(touristCreatedTargetId).toBe('guide1');
    expect(touristCreatedTargetType).toBe('guide');
  });
});