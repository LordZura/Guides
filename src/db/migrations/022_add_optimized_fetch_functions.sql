-- Optimized functions for fetching guides and tours with review summaries
-- This eliminates the N+1 query problem by using JOINs instead of individual RPC calls

-- Function to get guides with review summaries and filtering
CREATE OR REPLACE FUNCTION get_guides_with_reviews(
  language_filter TEXT DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  min_review_count INTEGER DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  role TEXT,
  bio TEXT,
  location TEXT,
  languages TEXT[],
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.role,
    p.bio,
    p.location,
    p.languages,
    p.phone,
    p.avatar_url,
    p.created_at,
    p.updated_at,
    COALESCE(rs.average_rating, 0) as average_rating,
    COALESCE(rs.total_reviews, 0) as total_reviews,
    COALESCE(rs.rating_counts, '{}') as rating_counts
  FROM public.profiles p
  LEFT JOIN public.review_summaries rs ON (p.id = rs.target_id AND rs.target_type = 'guide')
  WHERE p.role = 'guide'
    AND (language_filter IS NULL OR p.languages @> ARRAY[language_filter])
    AND (min_rating IS NULL OR COALESCE(rs.average_rating, 0) >= min_rating OR (COALESCE(rs.average_rating, 0) = 0 AND COALESCE(rs.total_reviews, 0) = 0))
    AND (min_review_count IS NULL OR COALESCE(rs.total_reviews, 0) >= min_review_count)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get tours with review summaries and filtering
CREATE OR REPLACE FUNCTION get_tours_with_reviews(
  creator_role_filter TEXT DEFAULT NULL,
  language_filter TEXT DEFAULT NULL,
  location_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  min_review_count INTEGER DEFAULT NULL,
  days_available_filter INTEGER[] DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  price NUMERIC,
  duration INTEGER,
  capacity INTEGER,
  languages TEXT[],
  is_private BOOLEAN,
  is_active BOOLEAN,
  creator_role TEXT,
  creator_id UUID,
  days_available BOOLEAN[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_counts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.description,
    t.location,
    t.price,
    t.duration,
    t.capacity,
    t.languages,
    t.is_private,
    t.is_active,
    t.creator_role,
    t.creator_id,
    t.days_available,
    t.created_at,
    t.updated_at,
    COALESCE(rs.average_rating, 0) as average_rating,
    COALESCE(rs.total_reviews, 0) as total_reviews,
    COALESCE(rs.rating_counts, '{}') as rating_counts
  FROM public.tours t
  LEFT JOIN public.review_summaries rs ON (t.id = rs.target_id AND rs.target_type = 'tour')
  WHERE t.is_active = true
    AND (creator_role_filter IS NULL OR t.creator_role = creator_role_filter)
    AND (language_filter IS NULL OR t.languages @> ARRAY[language_filter])
    AND (location_filter IS NULL OR t.location = location_filter)
    AND (min_price IS NULL OR t.price >= min_price)
    AND (max_price IS NULL OR t.price <= max_price)
    AND (min_rating IS NULL OR COALESCE(rs.average_rating, 0) >= min_rating OR (COALESCE(rs.average_rating, 0) = 0 AND COALESCE(rs.total_reviews, 0) = 0))
    AND (min_review_count IS NULL OR COALESCE(rs.total_reviews, 0) >= min_review_count)
    AND (days_available_filter IS NULL OR EXISTS (
      SELECT 1 FROM unnest(days_available_filter) AS day_idx
      WHERE day_idx >= 0 AND day_idx < 7 AND t.days_available[day_idx + 1] = true
    ))
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to the functions
GRANT EXECUTE ON FUNCTION get_guides_with_reviews(TEXT, NUMERIC, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_guides_with_reviews(TEXT, NUMERIC, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_tours_with_reviews(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tours_with_reviews(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, INTEGER, INTEGER[]) TO anon;