-- Create tour_templates table
CREATE TABLE public.tour_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL, -- Complete tour data structure
  is_system_template BOOLEAN DEFAULT false, -- System vs user templates
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for system templates
  category TEXT DEFAULT 'general', -- e.g., 'svaneti', 'cultural', 'adventure', 'wine'
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0, -- Track template popularity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_tour_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tour_templates_updated_at
BEFORE UPDATE ON public.tour_templates
FOR EACH ROW
EXECUTE FUNCTION update_tour_templates_updated_at();

-- Set up RLS (Row Level Security)
ALTER TABLE public.tour_templates ENABLE ROW LEVEL SECURITY;

-- Policy for viewing templates
CREATE POLICY "Anyone can view active system templates" 
  ON public.tour_templates 
  FOR SELECT 
  USING (is_active = true AND (is_system_template = true OR auth.uid() = creator_id));

-- Policy for users to create their own templates
CREATE POLICY "Users can create their own templates" 
  ON public.tour_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = creator_id AND is_system_template = false);

-- Policy for users to update their own templates
CREATE POLICY "Users can update their own templates" 
  ON public.tour_templates 
  FOR UPDATE 
  USING (auth.uid() = creator_id AND is_system_template = false);

-- Policy for users to delete their own templates
CREATE POLICY "Users can delete their own templates" 
  ON public.tour_templates 
  FOR DELETE 
  USING (auth.uid() = creator_id AND is_system_template = false);

-- Create indexes for performance
CREATE INDEX idx_tour_templates_creator_id ON public.tour_templates(creator_id);
CREATE INDEX idx_tour_templates_category ON public.tour_templates(category);
CREATE INDEX idx_tour_templates_is_system ON public.tour_templates(is_system_template);
CREATE INDEX idx_tour_templates_is_active ON public.tour_templates(is_active);
CREATE INDEX idx_tour_templates_usage_count ON public.tour_templates(usage_count DESC);

-- Insert default Svaneti templates (as mentioned in requirements)
INSERT INTO public.tour_templates (name, description, template_data, is_system_template, category) VALUES
(
  'Svaneti Highlights',
  'Classic multi-day Svaneti tour covering the main highlights',
  '{
    "title": "Svaneti Highlights Tour",
    "description": "Discover the ancient towers and stunning landscapes of Svaneti, one of Georgia''s most beautiful mountain regions.",
    "duration": 8,
    "price": 250,
    "capacity": 6,
    "languages": ["English", "Georgian"],
    "days_available": [true, true, true, true, true, true, true],
    "is_private": false,
    "locations": [
      {"id": "svaneti_1", "name": "Mestia", "notes": "Ancient tower houses and Svaneti Museum", "order": 1},
      {"id": "svaneti_2", "name": "Ushguli", "notes": "Highest permanently inhabited village in Europe", "order": 2},
      {"id": "svaneti_3", "name": "Lamaria Church", "notes": "12th century church with unique frescoes", "order": 3}
    ]
  }'::jsonb,
  true,
  'svaneti'
),
(
  'Svaneti Day Trip',
  'Single day Svaneti experience',
  '{
    "title": "Svaneti Day Tour",
    "description": "Perfect introduction to Svaneti with Mestia exploration and local culture.",
    "duration": 6,
    "price": 120,
    "capacity": 8,
    "languages": ["English", "Georgian"],
    "days_available": [true, true, true, true, true, true, true],
    "is_private": false,
    "locations": [
      {"id": "svaneti_day_1", "name": "Mestia", "notes": "Tower houses, museum, and local lunch", "order": 1}
    ]
  }'::jsonb,
  true,
  'svaneti'
),
(
  'Cultural Heritage Tour',
  'Focus on Georgian cultural sites and traditions',
  '{
    "title": "Georgian Cultural Heritage",
    "description": "Immerse yourself in centuries of Georgian culture, architecture, and traditions.",
    "duration": 4,
    "price": 80,
    "capacity": 10,
    "languages": ["English", "Georgian", "Russian"],
    "days_available": [true, true, true, true, true, false, false],
    "is_private": false,
    "locations": [
      {"id": "cultural_1", "name": "Historic Old Town", "notes": "Traditional architecture and local artisans", "order": 1},
      {"id": "cultural_2", "name": "Local Workshop", "notes": "Traditional craft demonstration", "order": 2}
    ]
  }'::jsonb,
  true,
  'cultural'
),
(
  'Wine Tasting Experience',
  'Discover Georgian wine-making traditions',
  '{
    "title": "Georgian Wine Heritage",
    "description": "Experience the ancient Georgian winemaking tradition with tastings and vineyard visits.",
    "duration": 5,
    "price": 150,
    "capacity": 8,
    "languages": ["English", "Georgian"],
    "days_available": [false, true, true, true, true, true, false],
    "is_private": false,
    "locations": [
      {"id": "wine_1", "name": "Traditional Winery", "notes": "Qvevri winemaking demonstration", "order": 1},
      {"id": "wine_2", "name": "Vineyard Tour", "notes": "Grape varieties and harvesting techniques", "order": 2}
    ]
  }'::jsonb,
  true,
  'wine'
);

-- Add comment for documentation
COMMENT ON TABLE public.tour_templates IS 'Templates for tour creation with system defaults and user-created templates';
COMMENT ON COLUMN public.tour_templates.template_data IS 'Complete tour data structure in JSON format for pre-filling forms';