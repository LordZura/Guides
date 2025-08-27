-- Create tours table
CREATE TABLE public.tours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  duration INTEGER NOT NULL, -- In hours
  price DECIMAL(10,2) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  languages TEXT[] DEFAULT '{}',
  days_available BOOLEAN[] DEFAULT '{false,false,false,false,false,false,false}', -- Sun-Sat
  is_private BOOLEAN DEFAULT false,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_role TEXT NOT NULL CHECK (creator_role IN ('guide', 'tourist')) DEFAULT 'guide',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_tours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tours_updated_at
BEFORE UPDATE ON public.tours
FOR EACH ROW
EXECUTE FUNCTION update_tours_updated_at();

-- Set up RLS (Row Level Security)
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view active tours
CREATE POLICY "Anyone can view active tours" 
  ON public.tours 
  FOR SELECT 
  USING (is_active = true);

-- Create policy for users to view their own tours
CREATE POLICY "Users can view their own tours" 
  ON public.tours 
  FOR SELECT 
  USING (auth.uid() = creator_id);

-- Create policy for users to create tours
CREATE POLICY "Users can create tours" 
  ON public.tours 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id);

-- Create policy for users to update their own tours
CREATE POLICY "Users can update their own tours" 
  ON public.tours 
  FOR UPDATE 
  USING (auth.uid() = creator_id);

-- Create policy for users to delete their own tours
CREATE POLICY "Users can delete their own tours" 
  ON public.tours 
  FOR DELETE 
  USING (auth.uid() = creator_id);

-- Create indexes for performance
CREATE INDEX idx_tours_creator_id ON public.tours(creator_id);
CREATE INDEX idx_tours_location ON public.tours(location);
CREATE INDEX idx_tours_is_active ON public.tours(is_active);
CREATE INDEX idx_tours_created_at ON public.tours(created_at);