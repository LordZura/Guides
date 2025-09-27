-- Create review_summaries table for efficient filtering
-- This table stores pre-calculated review aggregates to avoid N+1 queries

CREATE TABLE public.review_summaries (
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('guide', 'tour')),
  average_rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  rating_counts JSONB DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (target_id, target_type)
);

-- Create indexes for efficient filtering
CREATE INDEX idx_review_summaries_target_id ON public.review_summaries(target_id);
CREATE INDEX idx_review_summaries_target_type ON public.review_summaries(target_type);
CREATE INDEX idx_review_summaries_average_rating ON public.review_summaries(average_rating);
CREATE INDEX idx_review_summaries_total_reviews ON public.review_summaries(total_reviews);
CREATE INDEX idx_review_summaries_updated_at ON public.review_summaries(updated_at);

-- Compound indexes for common filter combinations
CREATE INDEX idx_review_summaries_type_rating ON public.review_summaries(target_type, average_rating);
CREATE INDEX idx_review_summaries_type_reviews ON public.review_summaries(target_type, total_reviews);

-- Set up RLS (Row Level Security)
ALTER TABLE public.review_summaries ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view review summaries
CREATE POLICY "Anyone can view review summaries" 
  ON public.review_summaries 
  FOR SELECT 
  USING (true);

-- Function to recalculate review summary for a specific target
CREATE OR REPLACE FUNCTION recalculate_review_summary(target_id_param UUID, target_type_param TEXT)
RETURNS void AS $$
DECLARE
  summary_record RECORD;
BEGIN
  -- Get the calculated summary using existing function
  SELECT * INTO summary_record 
  FROM get_review_summary(target_id_param, target_type_param) 
  LIMIT 1;
  
  -- Upsert the summary into the review_summaries table
  INSERT INTO public.review_summaries (target_id, target_type, average_rating, total_reviews, rating_counts, updated_at)
  VALUES (
    target_id_param,
    target_type_param,
    COALESCE(summary_record.average_rating, 0),
    COALESCE(summary_record.total_reviews, 0),
    COALESCE(summary_record.rating_counts, '{}'),
    NOW()
  )
  ON CONFLICT (target_id, target_type) DO UPDATE SET
    average_rating = COALESCE(summary_record.average_rating, 0),
    total_reviews = COALESCE(summary_record.total_reviews, 0),
    rating_counts = COALESCE(summary_record.rating_counts, '{}'),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to update review summaries when reviews change
CREATE OR REPLACE FUNCTION update_review_summaries()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle different trigger events
  IF TG_OP = 'INSERT' THEN
    -- Update summary for the new review's target
    PERFORM recalculate_review_summary(NEW.target_id, NEW.target_type);
    
    -- If it's a tour review, also update the guide's summary (tours contribute to guide ratings)
    IF NEW.target_type = 'tour' THEN
      PERFORM recalculate_review_summary(
        (SELECT creator_id FROM public.tours WHERE id = NEW.target_id),
        'guide'
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Update summaries for both old and new targets (in case target changed)
    PERFORM recalculate_review_summary(OLD.target_id, OLD.target_type);
    PERFORM recalculate_review_summary(NEW.target_id, NEW.target_type);
    
    -- Handle guide summaries for tour reviews
    IF OLD.target_type = 'tour' THEN
      PERFORM recalculate_review_summary(
        (SELECT creator_id FROM public.tours WHERE id = OLD.target_id),
        'guide'
      );
    END IF;
    
    IF NEW.target_type = 'tour' THEN
      PERFORM recalculate_review_summary(
        (SELECT creator_id FROM public.tours WHERE id = NEW.target_id),
        'guide'
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Update summary for the deleted review's target
    PERFORM recalculate_review_summary(OLD.target_id, OLD.target_type);
    
    -- If it was a tour review, also update the guide's summary
    IF OLD.target_type = 'tour' THEN
      PERFORM recalculate_review_summary(
        (SELECT creator_id FROM public.tours WHERE id = OLD.target_id),
        'guide'
      );
    END IF;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to keep review summaries updated
CREATE TRIGGER reviews_update_summaries
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_summaries();

-- Grant permissions
GRANT EXECUTE ON FUNCTION recalculate_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_review_summary(UUID, TEXT) TO anon;

-- Initial population of review summaries
-- This will be populated by the existing data, but only for targets that have reviews
INSERT INTO public.review_summaries (target_id, target_type, average_rating, total_reviews, rating_counts)
SELECT 
  target_id,
  target_type,
  COALESCE(summary.average_rating, 0),
  COALESCE(summary.total_reviews, 0),
  COALESCE(summary.rating_counts, '{}')
FROM (
  SELECT DISTINCT target_id, target_type FROM public.reviews
) targets
CROSS JOIN LATERAL (
  SELECT * FROM get_review_summary(targets.target_id, targets.target_type) LIMIT 1
) summary;

-- Also populate guide summaries (guides get ratings from their tours too)
INSERT INTO public.review_summaries (target_id, target_type, average_rating, total_reviews, rating_counts)
SELECT 
  profiles.id as target_id,
  'guide' as target_type,
  COALESCE(summary.average_rating, 0),
  COALESCE(summary.total_reviews, 0),
  COALESCE(summary.rating_counts, '{}')
FROM public.profiles
CROSS JOIN LATERAL (
  SELECT * FROM get_review_summary(profiles.id, 'guide') LIMIT 1
) summary
WHERE profiles.role = 'guide'
ON CONFLICT (target_id, target_type) DO UPDATE SET
  average_rating = EXCLUDED.average_rating,
  total_reviews = EXCLUDED.total_reviews,
  rating_counts = EXCLUDED.rating_counts,
  updated_at = NOW();