-- Create languages table
CREATE TABLE public.languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- ISO 639-1 language code
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS (Row Level Security) - read-only for all users
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view languages
CREATE POLICY "Anyone can view languages" 
  ON public.languages 
  FOR SELECT 
  TO authenticated, anon
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_languages_name ON public.languages(name);
CREATE INDEX idx_languages_code ON public.languages(code);

-- Insert common languages used in Georgian tourism
INSERT INTO public.languages (name, code) VALUES
  ('English', 'en'),
  ('Georgian', 'ka'),
  ('Russian', 'ru'),
  ('Spanish', 'es'),
  ('French', 'fr'),
  ('German', 'de'),
  ('Italian', 'it'),
  ('Japanese', 'ja'),
  ('Chinese', 'zh'),
  ('Arabic', 'ar'),
  ('Turkish', 'tr'),
  ('Armenian', 'hy');

-- Add comment for documentation
COMMENT ON TABLE public.languages IS 'Available languages for tours and guides';
COMMENT ON COLUMN public.languages.code IS 'ISO 639-1 two-letter language code';