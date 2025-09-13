-- Fix get_review_summary function to properly include rating_counts
-- This migration fixes the issue where rating_counts was not included in the function output

CREATE OR REPLACE FUNCTION get_review_summary(target_id_param UUID, target_type_param TEXT)
RETURNS TABLE(
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_counts JSONB
) AS $$
BEGIN
  -- If requesting guide summary, aggregate from tours plus direct guide reviews
  IF target_type_param = 'guide' THEN
    RETURN QUERY
    WITH guide_reviews AS (
      -- Direct guide reviews
      SELECT rating FROM public.reviews 
      WHERE target_id = target_id_param AND target_type = 'guide'
      UNION ALL
      -- Tour reviews for this guide's tours
      SELECT r.rating FROM public.reviews r
      JOIN public.tours t ON r.target_id = t.id
      WHERE t.creator_id = target_id_param 
        AND r.target_type = 'tour'
        AND t.creator_role = 'guide'
    )
    SELECT 
      COALESCE(AVG(gr.rating::NUMERIC), 0) as average_rating,
      COUNT(gr.*)::INTEGER as total_reviews,
      COALESCE(
        (
          SELECT jsonb_object_agg(rating::text, count) 
          FROM (
            SELECT rating, COUNT(*) as count 
            FROM guide_reviews 
            GROUP BY rating
          ) rating_dist
        ), 
        '{}'::jsonb
      ) as rating_counts
    FROM guide_reviews gr;
  ELSE
    -- For tours and other targets, use the original logic
    RETURN QUERY
    SELECT 
      COALESCE(AVG(r.rating::NUMERIC), 0) as average_rating,
      COUNT(r.*)::INTEGER as total_reviews,
      COALESCE(
        (
          SELECT jsonb_object_agg(rating::text, count) 
          FROM (
            SELECT rating, COUNT(*) as count 
            FROM public.reviews 
            WHERE target_id = target_id_param 
              AND target_type = target_type_param
            GROUP BY rating
          ) rating_dist
        ), 
        '{}'::jsonb
      ) as rating_counts
    FROM public.reviews r
    WHERE r.target_id = target_id_param 
      AND r.target_type = target_type_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Review summary function updated to include rating_counts!';
END
$$;