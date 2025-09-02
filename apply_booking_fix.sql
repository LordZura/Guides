-- URGENT FIX: Apply booking update policy fix
-- This script resolves the "Tourist is not allowed to perform this update" error
-- 
-- Run this in your Supabase SQL Editor to fix payment processing issues

-- First, verify the current policy exists
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings' 
  AND policyname = 'Users can update relevant bookings';

-- Apply the fix (from migration 012_fix_bookings_update_policy.sql)
-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update relevant bookings" ON public.bookings;

-- Recreate the UPDATE policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update relevant bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = tourist_id OR auth.uid() = guide_id)
  WITH CHECK (auth.uid() = tourist_id OR auth.uid() = guide_id);

-- Add comment explaining the fix
COMMENT ON POLICY "Users can update relevant bookings" ON public.bookings IS 
'Allows both tourists and guides to update bookings they are involved in. Includes both USING and WITH CHECK clauses for proper RLS enforcement.';

-- Verify the fix was applied
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'bookings' 
  AND policyname = 'Users can update relevant bookings';

-- Also verify RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bookings';