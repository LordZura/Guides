-- Test script to verify the review functionality fixes
-- This script should be run manually in Supabase SQL editor to test the new functions

-- First, let's check if the functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_review_summary', 'get_guide_rating_from_tours');

-- Test the get_review_summary function for a tour (should work for any existing tour)
-- Replace 'YOUR_TOUR_ID' with an actual tour ID from your database
-- SELECT * FROM get_review_summary('YOUR_TOUR_ID'::UUID, 'tour');

-- Test the get_review_summary function for a guide (should work for any existing guide)
-- Replace 'YOUR_GUIDE_ID' with an actual guide ID from your database
-- SELECT * FROM get_review_summary('YOUR_GUIDE_ID'::UUID, 'guide');

-- Test the get_guide_rating_from_tours function
-- Replace 'YOUR_GUIDE_ID' with an actual guide ID from your database
-- SELECT * FROM get_guide_rating_from_tours('YOUR_GUIDE_ID'::UUID);

-- Check if there are any existing reviews and their target types
SELECT target_type, COUNT(*) as count 
FROM reviews 
GROUP BY target_type;

-- Check tours and their creators
SELECT t.id, t.title, t.creator_id, p.full_name as guide_name
FROM tours t
JOIN profiles p ON t.creator_id = p.id
WHERE t.creator_role = 'guide'
LIMIT 5;

-- Check reviews and their targets
SELECT r.id, r.target_type, r.rating, r.comment, 
       CASE 
         WHEN r.target_type = 'tour' THEN t.title
         WHEN r.target_type = 'guide' THEN p.full_name
         ELSE 'Unknown'
       END as target_name
FROM reviews r
LEFT JOIN tours t ON r.target_id = t.id AND r.target_type = 'tour'
LEFT JOIN profiles p ON r.target_id = p.id AND r.target_type = 'guide'
ORDER BY r.created_at DESC
LIMIT 10;