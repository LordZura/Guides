import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

interface RatingData {
  averageRating: number;
  reviewCount: number;
  ratingCounts: Record<number, number>;
}

interface RatingHookResult extends RatingData {
  isLoading: boolean;
  refreshRating: () => Promise<void>;
}

interface InitialRatingData {
  averageRating?: number;
  reviewCount?: number;
}

/**
 * Hook to manage guide rating data - completely recreated with clean logic
 */
export const useGuideRating = (guideId: string, initialData?: InitialRatingData): RatingHookResult => {
  const [averageRating, setAverageRating] = useState<number>(initialData?.averageRating || 0);
  const [reviewCount, setReviewCount] = useState<number>(initialData?.reviewCount || 0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Fetch rating data from database
   */
  const fetchRatingData = useCallback(async () => {
    if (!guideId) {
      return;
    }

    setIsLoading(true);
    try {
      // Call the database function to get rating summary
      const { data, error } = await supabase.rpc('get_review_summary', {
        target_id_param: guideId,
        target_type_param: 'guide',
      });

      if (error) {
        console.error('Error fetching guide rating:', error);
        // Use initial data when database fails
        if (initialData) {
          setAverageRating(initialData.averageRating || 0);
          setReviewCount(initialData.reviewCount || 0);
          setRatingCounts({});
        }
        return;
      }

      // Handle response data (could be array or single object)
      const summaryData = Array.isArray(data) ? data[0] : data;

      if (summaryData) {
        // Extract and set rating data with proper defaults
        const avgRating = Number(summaryData.average_rating) || 0;
        const totalReviews = Number(summaryData.total_reviews) || 0;
        
        // Parse rating counts from JSONB
        let counts: Record<number, number> = {};
        if (summaryData.rating_counts) {
          try {
            // rating_counts should be a JSONB object like {"1": 2, "4": 3, "5": 8}
            const rawCounts = typeof summaryData.rating_counts === 'string' 
              ? JSON.parse(summaryData.rating_counts)
              : summaryData.rating_counts;
            
            // Convert string keys to numbers and ensure numeric values
            Object.entries(rawCounts || {}).forEach(([key, value]) => {
              const numKey = parseInt(key, 10);
              const numValue = Number(value) || 0;
              if (numKey >= 1 && numKey <= 5) {
                counts[numKey] = numValue;
              }
            });
          } catch (e) {
            console.warn('Failed to parse rating_counts:', e);
          }
        }

        setAverageRating(avgRating);
        setReviewCount(totalReviews);
        setRatingCounts(counts);
      } else {
        // No data from database - use initial data if available, otherwise reset to defaults
        setAverageRating(initialData?.averageRating || 0);
        setReviewCount(initialData?.reviewCount || 0);
        setRatingCounts({});
      }
    } catch (error) {
      console.error('Error in fetchRatingData:', error);
      // On error, use initial data if available
      if (initialData) {
        setAverageRating(initialData.averageRating || 0);
        setReviewCount(initialData.reviewCount || 0);
        setRatingCounts({});
      }
    } finally {
      setIsLoading(false);
    }
  }, [guideId, initialData]);

  /**
   * Handle rating update events
   */
  useEffect(() => {
    const handleRatingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.guideId === guideId) {
        fetchRatingData();
      }
    };

    // Listen for rating update events
    window.addEventListener('guideRatingUpdated', handleRatingUpdate);
    
    // Initial fetch
    fetchRatingData();

    return () => {
      window.removeEventListener('guideRatingUpdated', handleRatingUpdate);
    };
  }, [guideId, fetchRatingData]);

  return {
    averageRating,
    reviewCount,
    ratingCounts,
    isLoading,
    refreshRating: fetchRatingData,
  };
};

/**
 * Trigger rating update event for a guide
 */
export const triggerGuideRatingUpdate = (guideId: string) => {
  if (!guideId) return;
  
  const event = new CustomEvent('guideRatingUpdated', {
    detail: { guideId },
  });
  window.dispatchEvent(event);
};
