-- Add unique constraint to prevent duplicate reviews
-- A user should only be able to review a specific target (tour or guide) once

-- Add unique constraint for reviewer_id and target_id combination
-- This prevents a user from reviewing the same tour or guide multiple times
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_reviewer_target 
ON public.reviews(reviewer_id, target_id, target_type);

-- Add a comment to explain the constraint
COMMENT ON INDEX idx_reviews_unique_reviewer_target IS 'Ensures a user can only review a specific tour or guide once';