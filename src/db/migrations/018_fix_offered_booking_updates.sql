-- Fix booking updates for offered bookings to allow tourists to accept offers
-- This addresses the "Tourist is not allowed to perform this update" error
-- when tourists try to accept booking offers from guides

-- First, let's check the current policies and drop them to recreate with proper logic
DROP POLICY IF EXISTS "Users can update relevant bookings" ON public.bookings;

-- Create a more comprehensive update policy that handles all booking flows
CREATE POLICY "Users can update relevant bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (
    -- Tourists can update their own bookings (when they are the tourist)
    auth.uid() = tourist_id OR 
    -- Guides can update bookings for their tours (when they are the guide)
    auth.uid() = guide_id
  )
  WITH CHECK (
    -- Allow the same conditions for WITH CHECK as USING
    auth.uid() = tourist_id OR 
    auth.uid() = guide_id
  );

-- Add specific comment explaining the policy
COMMENT ON POLICY "Users can update relevant bookings" ON public.bookings IS 
'Allows tourists to update bookings where they are the tourist (including accepting offers) and guides to update bookings where they are the guide. Handles both requested and offered booking flows.';

-- Also ensure the INSERT policy is correct for offered bookings
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;

-- Recreate the INSERT policy to be explicit about both flows
CREATE POLICY "Users can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (
    -- Tourists can create requests (status = 'requested')
    (auth.uid() = tourist_id AND status = 'requested') OR
    -- Guides can create offers (status = 'offered')
    (auth.uid() = guide_id AND status = 'offered')
  );

COMMENT ON POLICY "Users can create bookings" ON public.bookings IS 
'Allows tourists to create booking requests and guides to create booking offers.';