-- Add 'offered' status to the booking status constraint
-- This allows guides to offer tours to tourists in addition to tourists requesting tours

-- Drop the existing constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- Add the new constraint with 'offered' status included
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('requested', 'offered', 'accepted', 'declined', 'paid', 'completed', 'cancelled'));

-- Update the comment to reflect the change
COMMENT ON COLUMN public.bookings.status IS 'Booking status: requested (tourist requests), offered (guide offers), accepted, declined, paid, completed, cancelled';

-- Add policy for guides to create offer bookings
-- Drop existing restrictive policies and recreate them to be more flexible
DROP POLICY IF EXISTS "Tourists can create bookings" ON public.bookings;

-- New policy allows both tourists to request and guides to offer
CREATE POLICY "Users can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (
    (auth.uid() = tourist_id AND status = 'requested') OR
    (auth.uid() = guide_id AND status = 'offered')
  );