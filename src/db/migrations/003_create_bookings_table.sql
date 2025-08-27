-- Create bookings table
CREATE TABLE public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES public.tours(id) ON DELETE CASCADE,
  tourist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('requested', 'accepted', 'declined', 'paid', 'completed', 'cancelled')) DEFAULT 'requested',
  party_size INTEGER NOT NULL DEFAULT 1,
  booking_date DATE NOT NULL,
  preferred_time TIME,
  notes TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION update_bookings_updated_at();

-- Set up RLS (Row Level Security)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for tourists to view their own bookings
CREATE POLICY "Tourists can view their own bookings" 
  ON public.bookings 
  FOR SELECT 
  USING (auth.uid() = tourist_id);

-- Create policy for guides to view bookings for their tours
CREATE POLICY "Guides can view bookings for their tours" 
  ON public.bookings 
  FOR SELECT 
  USING (auth.uid() = guide_id);

-- Create policy for tourists to create bookings
CREATE POLICY "Tourists can create bookings" 
  ON public.bookings 
  FOR INSERT 
  WITH CHECK (auth.uid() = tourist_id);

-- Create policy for users to update their own bookings
CREATE POLICY "Users can update relevant bookings" 
  ON public.bookings 
  FOR UPDATE 
  USING (auth.uid() = tourist_id OR auth.uid() = guide_id);

-- Create indexes for performance
CREATE INDEX idx_bookings_tourist_id ON public.bookings(tourist_id);
CREATE INDEX idx_bookings_guide_id ON public.bookings(guide_id);
CREATE INDEX idx_bookings_tour_id ON public.bookings(tour_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);