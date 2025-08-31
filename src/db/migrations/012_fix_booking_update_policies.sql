-- Fix RLS policies for booking updates to allow payment status changes
-- This addresses the issue where tourists cannot update their bookings to 'paid' status

-- Drop the existing update policy that might be too restrictive
DROP POLICY IF EXISTS "Users can update relevant bookings" ON public.bookings;

-- Create more specific policies for different types of updates

-- Policy 1: Tourists can update their bookings to 'paid' status and cancel
CREATE POLICY "Tourists can pay for their bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = tourist_id);

-- Policy 2: Guides can update bookings for their tours  
CREATE POLICY "Guides can update their tour bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = guide_id);

-- Add an index on status for better performance with these policies
CREATE INDEX IF NOT EXISTS idx_bookings_status_tourist ON public.bookings(status, tourist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_guide ON public.bookings(status, guide_id);

-- Add comments for documentation
COMMENT ON POLICY "Tourists can pay for their bookings" ON public.bookings IS 
'Allows tourists to update their own bookings (primarily for payment)';

COMMENT ON POLICY "Guides can update their tour bookings" ON public.bookings IS 
'Allows guides to manage bookings for their tours';