-- Debug and fix booking update policies for offered bookings
-- Add more detailed logging and ensure proper RLS for tourist accepting offers

-- Create a function to debug booking updates
CREATE OR REPLACE FUNCTION debug_booking_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the update attempt for debugging
  RAISE LOG 'Booking update attempt: ID=%, OLD.status=%, NEW.status=%, auth.uid()=%, tourist_id=%, guide_id=%', 
    NEW.id, OLD.status, NEW.status, auth.uid(), NEW.tourist_id, NEW.guide_id;
    
  -- Allow the update to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for debugging (can be removed in production)
DROP TRIGGER IF EXISTS debug_booking_updates ON public.bookings;
CREATE TRIGGER debug_booking_updates
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION debug_booking_update();

-- Ensure RLS policies are correct for the offered booking flow
-- Drop existing policies to recreate them with explicit handling
DROP POLICY IF EXISTS "Users can update relevant bookings" ON public.bookings;

-- Create comprehensive update policy with explicit offered booking handling
CREATE POLICY "Users can update relevant bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (
    -- Tourists can update bookings where they are the tourist
    (auth.uid() = tourist_id) OR
    -- Guides can update bookings where they are the guide
    (auth.uid() = guide_id)
  )
  WITH CHECK (
    -- Same conditions for WITH CHECK
    (auth.uid() = tourist_id) OR
    (auth.uid() = guide_id)
  );

-- Add explicit comment for clarity
COMMENT ON POLICY "Users can update relevant bookings" ON public.bookings IS 
'Allows tourists to update any booking where they are the tourist_id (including accepting offers from guides) and guides to update any booking where they are the guide_id. This explicitly supports the offered booking flow where guides create offers (guide_id=guide, tourist_id=target_tourist) and tourists can accept them.';

-- Verify the policy is working by adding some helpful functions
CREATE OR REPLACE FUNCTION can_user_update_booking(booking_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  booking_record RECORD;
BEGIN
  SELECT tourist_id, guide_id INTO booking_record 
  FROM public.bookings 
  WHERE id = booking_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN (user_id = booking_record.tourist_id OR user_id = booking_record.guide_id);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to this helper function
GRANT EXECUTE ON FUNCTION can_user_update_booking(UUID, UUID) TO authenticated;