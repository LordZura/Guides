-- Optional: drop existing variant with same signature (safe)
DROP FUNCTION IF EXISTS get_review_summary(UUID, TEXT);

CREATE OR REPLACE FUNCTION get_review_summary(target_id_param UUID, target_type_param TEXT)
RETURNS TABLE(
  average_rating NUMERIC,
  total_reviews INTEGER,
  rating_counts JSONB
) AS $$
BEGIN
  IF target_type_param = 'guide' THEN
    RETURN QUERY
    WITH guide_reviews AS (
      -- explicit aliasing so column resolution is unambiguous
      SELECT r.rating::TEXT  AS rating_text,
             r.rating        AS rating_val
      FROM public.reviews r
      WHERE r.target_id = target_id_param
        AND r.target_type = 'guide'

      UNION ALL

      SELECT r.rating::TEXT, r.rating
      FROM public.reviews r
      JOIN public.tours t ON r.target_id = t.id
      WHERE t.creator_id = target_id_param
        AND r.target_type = 'tour'
        AND t.creator_role = 'guide'
    )
    SELECT
      COALESCE(AVG(rating_val::NUMERIC), 0)        AS average_rating,
      COUNT(*)::INTEGER                            AS total_reviews,
      (
        SELECT jsonb_object_agg(rating_text, cnt)
        FROM (
          SELECT rating_text, COUNT(*) AS cnt
          FROM guide_reviews
          GROUP BY rating_text
        ) sub
      )                                             AS rating_counts
    FROM guide_reviews;

  ELSE
    RETURN QUERY
    WITH target_reviews AS (
      SELECT r.rating::TEXT  AS rating_text,
             r.rating        AS rating_val
      FROM public.reviews r
      WHERE r.target_id = target_id_param
        AND r.target_type = target_type_param
    ),
    summary AS (
      SELECT COALESCE(AVG(rating_val::NUMERIC), 0) AS avg_rating,
             COUNT(*)::INTEGER                     AS total
      FROM target_reviews
    )
    SELECT
      s.avg_rating   AS average_rating,
      s.total        AS total_reviews,
      (
        SELECT jsonb_object_agg(rating_text, cnt)
        FROM (
          SELECT rating_text, COUNT(*) AS cnt
          FROM target_reviews
          GROUP BY rating_text
        ) sub
      )               AS rating_counts
    FROM summary s;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- reapply grants
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_summary(UUID, TEXT) TO anon;
