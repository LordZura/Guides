-- Create get_review_summary RPC function
-- This function calculates the average rating and total review count for a given target
CREATE OR REPLACE FUNCTION get_review_summary(target_id_param UUID, target_type_param TEXT)
RETURNS TABLE(
  average_rating NUMERIC,
  total_reviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating::NUMERIC), 0) as average_rating,
    COUNT(*)::INTEGER as total_reviews
  FROM public.reviews 
  WHERE target_id = target_id_param 
    AND target_type = target_type_param;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO anon;