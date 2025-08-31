-- Fix bookings UPDATE policy to include WITH CHECK clause
-- This resolves the "Tourist is not allowed to perform this update" error

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