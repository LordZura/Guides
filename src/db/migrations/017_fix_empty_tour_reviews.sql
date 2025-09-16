-- Fix get_review_summary function to always return a row, even when there are no reviews
-- This addresses the issue where tour ratings show as 0 because the function returns empty result set

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
      COALESCE(AVG(rating::NUMERIC), 0) as average_rating,
      COUNT(*)::INTEGER as total_reviews,
      (
        SELECT jsonb_object_agg(
          rating::text, 
          count
        )
        FROM (
          SELECT rating, COUNT(*) as count
          FROM guide_reviews
          GROUP BY rating
        ) rating_breakdown
      ) as rating_counts;
  ELSE
    -- For tours and other targets, use aggregation with dummy table to ensure we always get a row
    RETURN QUERY
    WITH target_reviews AS (
      SELECT rating FROM public.reviews
      WHERE target_id = target_id_param 
        AND target_type = target_type_param
    ),
    summary AS (
      SELECT 
        COALESCE(AVG(rating::NUMERIC), 0) as avg_rating,
        COUNT(*)::INTEGER as total
      FROM target_reviews
    )
    SELECT 
      s.avg_rating as average_rating,
      s.total as total_reviews,
      (
        SELECT jsonb_object_agg(
          rating::text, 
          count
        )
        FROM (
          SELECT rating, COUNT(*) as count
          FROM target_reviews
          GROUP BY rating
        ) rating_breakdown
      ) as rating_counts
    FROM summary s;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO anon;