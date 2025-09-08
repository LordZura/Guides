-- Safe migration script to apply the review fixes
-- This script includes checks to prevent errors if functions already exist

-- Check if the functions already exist
DO $$
BEGIN
    -- Only create get_guide_rating_from_tours if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'get_guide_rating_from_tours'
    ) THEN
        -- Create function to get guide rating aggregated from all their tour reviews
        EXECUTE '
        CREATE OR REPLACE FUNCTION get_guide_rating_from_tours(guide_id_param UUID)
        RETURNS TABLE(
          average_rating NUMERIC,
          total_reviews INTEGER
        ) AS $func$
        BEGIN
          RETURN QUERY
          SELECT 
            COALESCE(AVG(r.rating::NUMERIC), 0) as average_rating,
            COUNT(r.*)::INTEGER as total_reviews
          FROM public.reviews r
          JOIN public.tours t ON r.target_id = t.id
          WHERE t.creator_id = guide_id_param 
            AND r.target_type = ''tour''
            AND t.creator_role = ''guide'';
        END;
        $func$ LANGUAGE plpgsql;
        ';
        
        -- Grant permissions
        GRANT EXECUTE ON FUNCTION get_guide_rating_from_tours(UUID) TO authenticated;
        GRANT EXECUTE ON FUNCTION get_guide_rating_from_tours(UUID) TO anon;
        
        RAISE NOTICE 'Created get_guide_rating_from_tours function';
    ELSE
        RAISE NOTICE 'Function get_guide_rating_from_tours already exists, skipping creation';
    END IF;
END
$$;

-- Always update the get_review_summary function to include the new logic
CREATE OR REPLACE FUNCTION get_review_summary(target_id_param UUID, target_type_param TEXT)
RETURNS TABLE(
  average_rating NUMERIC,
  total_reviews INTEGER
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
      COUNT(*)::INTEGER as total_reviews
    FROM guide_reviews;
  ELSE
    -- For tours and other targets, use the original logic
    RETURN QUERY
    SELECT 
      COALESCE(AVG(rating::NUMERIC), 0) as average_rating,
      COUNT(*)::INTEGER as total_reviews
    FROM public.reviews 
    WHERE target_id = target_id_param 
      AND target_type = target_type_param;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO anon;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Review system migration completed successfully!';
    RAISE NOTICE 'Guide ratings will now aggregate from both direct guide reviews and tour reviews.';
    RAISE NOTICE 'Tour reviews will be properly isolated per tour.';
END
$$;