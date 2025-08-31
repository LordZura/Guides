# Booking Payment Issue Fix

## Problem
Users experiencing payment failures with errors:
- "Error updating booking - Tourist is not allowed to perform this update"
- "Payment status update failed - Your payment was processed, but updating the booking status failed"

## Root Cause
The Row Level Security (RLS) policies for the bookings table were too restrictive, preventing tourists from updating their bookings to 'paid' status.

## Solution
1. **Database Migration**: Updated RLS policies to allow proper access
2. **Improved Error Handling**: Added better debugging and user-friendly error messages

## Database Migration Required

Run this SQL in your Supabase SQL Editor:

```sql
-- Execute the contents of: src/db/migrations/012_fix_booking_update_policies.sql
```

The migration simplifies the RLS policies to:
- Allow tourists to update their own bookings (for payment)
- Allow guides to update bookings for their tours
- Remove overly complex constraints that were blocking legitimate updates

## Code Changes
- Enhanced error handling in `BookingContext.tsx` with better logging
- More specific error messages for RLS policy violations
- Additional debugging information for troubleshooting

## Testing
To test the fix:
1. Apply the database migration
2. Create a booking as a tourist
3. Have the guide accept it
4. Try to pay for the booking as a tourist
5. Verify the payment status updates successfully