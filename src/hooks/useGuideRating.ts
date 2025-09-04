import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

// Allow any object that might have rating data
type GuideData = {
  average_rating?: number;
  reviews_count?: number;
  [key: string]: any;
};

// Custom hook to manage guide rating data with refresh capability
export const useGuideRating = (guideId: string, existingData?: GuideData) => {
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRatingData = useCallback(async () => {
    // If we have existing rating data in the guide object, use it
    if (existingData && 'average_rating' in existingData && 'reviews_count' in existingData) {
      setAverageRating(existingData.average_rating || 0);
      setReviewCount(existingData.reviews_count || 0);
      return;
    }

    // Otherwise fetch from database
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_review_summary', { 
          target_id_param: guideId, 
          target_type_param: 'guide' 
        });
      
      if (error) throw error;
      
      if (data) {
        setAverageRating(data.average_rating || 0);
        setReviewCount(data.total_reviews || 0);
      }
    } catch (err) {
      console.error('Error fetching guide rating:', err);
      // Keep existing values on error
    } finally {
      setIsLoading(false);
    }
  }, [guideId, existingData]);

  // Listen for rating update events
  useEffect(() => {
    const handleRatingUpdate = (event: CustomEvent) => {
      if (event.detail.guideId === guideId) {
        // Refresh rating data when this guide's rating is updated
        fetchRatingData();
      }
    };

    window.addEventListener('guideRatingUpdated', handleRatingUpdate as EventListener);
    
    // Initial fetch
    fetchRatingData();

    return () => {
      window.removeEventListener('guideRatingUpdated', handleRatingUpdate as EventListener);
    };
  }, [guideId, fetchRatingData]);

  return {
    averageRating,
    reviewCount,
    isLoading,
    refreshRating: fetchRatingData,
  };
};

// Utility function to trigger rating update events
export const triggerGuideRatingUpdate = (guideId: string) => {
  const event = new CustomEvent('guideRatingUpdated', {
    detail: { guideId }
  });
  window.dispatchEvent(event);
};