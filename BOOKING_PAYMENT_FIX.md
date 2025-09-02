# Booking Payment Update Fix

## Problem Description
When tourists complete payment for bookings, they encounter the error:
```
Error updating booking status: {code: 'P0001', details: null, hint: null, message: 'Tourist is not allowed to perform this update'}
```

This error occurs during the PATCH request to update the booking status from any status to 'paid'.

## Root Cause
The issue is with PostgreSQL Row Level Security (RLS) policies on the `bookings` table. The UPDATE policy may be missing or incorrectly configured.

## Immediate Fix

### Option 1: Quick Fix Script
Run the `apply_booking_fix.sql` script in your Supabase SQL Editor:

```bash
# This file contains verification queries and the fix
cat apply_booking_fix.sql
```

### Option 2: Manual Migration
Apply migration `012_fix_bookings_update_policy.sql` in your Supabase SQL Editor:

```sql
-- From: src/db/migrations/012_fix_bookings_update_policy.sql
DROP POLICY IF EXISTS "Users can update relevant bookings" ON public.bookings;

CREATE POLICY "Users can update relevant bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = tourist_id OR auth.uid() = guide_id)
  WITH CHECK (auth.uid() = tourist_id OR auth.uid() = guide_id);
```

## Verification

### Step 1: Check Current Policies
Run this query to see current RLS policies:
```sql
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'bookings'
ORDER BY policyname;
```

### Step 2: Test the Fix
After applying the fix, verify that booking status updates work by testing the payment flow in the application.

### Step 3: Debug if Still Failing
If the issue persists, run the `debug_booking_policies.sql` script to get detailed information about:
- Current RLS policies
- Table constraints
- Triggers
- RLS enablement status

## Technical Details

### What This Fixes
- Ensures both tourists and guides can update bookings they are involved in
- Adds proper `WITH CHECK` clause for PostgreSQL RLS compliance
- Maintains security by only allowing updates for relevant users

### Files Changed
- `apply_booking_fix.sql` - Immediate fix script with verification
- `debug_booking_policies.sql` - Diagnostic script
- `DATABASE_MIGRATION_FIX.md` - Updated troubleshooting guide

### Migration Order
This fix should be applied after:
1. `003_create_bookings_table.sql` - Creates the initial table and policies
2. `010_add_offered_status_to_bookings.sql` - Adds 'offered' status support

## Related Files
- `src/contexts/BookingContext.tsx` - Contains the `updateBookingStatus` function that triggers this error
- `src/components/BookingsList.tsx` - Uses `updateBookingStatus` for payment processing (line 208)
- `src/db/migrations/012_fix_bookings_update_policy.sql` - The official migration file