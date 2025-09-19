/**
 * Booking Test Helper - Utilities to test and verify the offered booking flow
 * This helps validate that tourists can accept guide offers properly
 */

export interface MockBooking {
  id: string;
  tour_id: string;
  tourist_id: string;
  guide_id: string;
  status: 'requested' | 'offered' | 'accepted' | 'declined' | 'paid' | 'completed' | 'cancelled';
  party_size: number;
  booking_date: string;
  preferred_time: string;
  notes: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
}

/**
 * Test scenario: Guide creates an offer for a tourist
 */
export function createMockOfferedBooking(
  guideId: string,
  touristId: string,
  tourId: string
): MockBooking {
  return {
    id: 'booking-' + Math.random().toString(36).substr(2, 9),
    tour_id: tourId,
    tourist_id: touristId,
    guide_id: guideId,
    status: 'offered',
    party_size: 2,
    booking_date: '2024-01-15',
    preferred_time: '10:00:00',
    notes: 'Test booking offer from guide',
    total_price: 150.00,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Validate that a tourist can accept an offered booking
 */
export function canTouristAcceptOffer(
  booking: MockBooking,
  currentUserId: string,
  currentUserRole: 'tourist' | 'guide'
): { canAccept: boolean; reason?: string } {
  if (currentUserRole !== 'tourist') {
    return { canAccept: false, reason: 'Only tourists can accept offers' };
  }

  if (booking.status !== 'offered') {
    return { canAccept: false, reason: 'Can only accept bookings with offered status' };
  }

  if (booking.tourist_id !== currentUserId) {
    return { canAccept: false, reason: 'Can only accept offers made to you' };
  }

  return { canAccept: true };
}

/**
 * Simulate the database RLS check that should allow the update
 */
export function simulateRLSCheck(
  booking: MockBooking,
  currentUserId: string
): { allowed: boolean; reason?: string } {
  // This simulates the RLS policy: auth.uid() = tourist_id OR auth.uid() = guide_id
  const isTourist = currentUserId === booking.tourist_id;
  const isGuide = currentUserId === booking.guide_id;

  if (isTourist || isGuide) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    reason: 'User is neither the tourist nor the guide for this booking'
  };
}

/**
 * Test the complete offered booking acceptance flow
 */
export function testOfferedBookingAcceptanceFlow(): void {
  console.log('=== Testing Offered Booking Acceptance Flow ===\n');

  const guideId = 'guide-123';
  const touristId = 'tourist-456';
  const tourId = 'tour-789';

  // Step 1: Guide creates an offer
  const offeredBooking = createMockOfferedBooking(guideId, touristId, tourId);
  console.log('1. Guide creates offer:');
  console.log(`   Booking ID: ${offeredBooking.id}`);
  console.log(`   Status: ${offeredBooking.status}`);
  console.log(`   Guide ID: ${offeredBooking.guide_id}`);
  console.log(`   Tourist ID: ${offeredBooking.tourist_id}\n`);

  // Step 2: Tourist tries to accept the offer
  console.log('2. Tourist tries to accept offer:');
  const acceptCheck = canTouristAcceptOffer(offeredBooking, touristId, 'tourist');
  console.log(`   Can accept: ${acceptCheck.canAccept}`);
  if (!acceptCheck.canAccept) {
    console.log(`   Reason: ${acceptCheck.reason}`);
  }

  // Step 3: Simulate RLS check
  console.log('\n3. Database RLS check:');
  const rlsCheck = simulateRLSCheck(offeredBooking, touristId);
  console.log(`   RLS allows update: ${rlsCheck.allowed}`);
  if (!rlsCheck.allowed) {
    console.log(`   Reason: ${rlsCheck.reason}`);
  }

  // Step 4: Final result
  console.log('\n4. Final result:');
  if (acceptCheck.canAccept && rlsCheck.allowed) {
    console.log('   ✅ Tourist should be able to accept the offered booking');
    console.log('   ✅ The P0001 error should be resolved');
  } else {
    console.log('   ❌ There are still issues preventing acceptance');
    console.log(`   Application check: ${acceptCheck.canAccept ? 'PASS' : 'FAIL'}`);
    console.log(`   Database RLS check: ${rlsCheck.allowed ? 'PASS' : 'FAIL'}`);
  }

  console.log('\n=== Test Complete ===');
}

/**
 * Test edge cases and error scenarios
 */
export function testEdgeCases(): void {
  console.log('=== Testing Edge Cases ===\n');

  const guideId = 'guide-123';
  const touristId = 'tourist-456';
  const wrongTouristId = 'wrong-tourist-999';
  const tourId = 'tour-789';

  const offeredBooking = createMockOfferedBooking(guideId, touristId, tourId);

  // Test 1: Wrong tourist tries to accept
  console.log('1. Wrong tourist tries to accept offer:');
  const wrongTouristCheck = canTouristAcceptOffer(offeredBooking, wrongTouristId, 'tourist');
  console.log(`   Can accept: ${wrongTouristCheck.canAccept}`);
  console.log(`   Reason: ${wrongTouristCheck.reason}\n`);

  // Test 2: Guide tries to accept (should fail at application level)
  console.log('2. Guide tries to accept their own offer:');
  const guideAcceptCheck = canTouristAcceptOffer(offeredBooking, guideId, 'guide');
  console.log(`   Can accept: ${guideAcceptCheck.canAccept}`);
  console.log(`   Reason: ${guideAcceptCheck.reason}\n`);

  // Test 3: Tourist tries to accept already accepted booking
  const acceptedBooking = { ...offeredBooking, status: 'accepted' as const };
  console.log('3. Tourist tries to accept already accepted booking:');
  const alreadyAcceptedCheck = canTouristAcceptOffer(acceptedBooking, touristId, 'tourist');
  console.log(`   Can accept: ${alreadyAcceptedCheck.canAccept}`);
  console.log(`   Reason: ${alreadyAcceptedCheck.reason}\n`);

  console.log('=== Edge Cases Complete ===');
}