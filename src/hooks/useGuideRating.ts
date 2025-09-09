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
  const [averageRating, setAverageRating] = useState<number>(
    existingData?.average_rating || 0
  );
  const [reviewCount, setReviewCount] = useState<number>(
    existingData?.reviews_count || 0
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchRatingData = useCallback(async () => {
    if (!guideId) return;
    
    // Only fetch if we don't have data or we're forcing a refresh
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_review_summary', { 
          target_id_param: guideId, 
          target_type_param: 'guide' 
        });
      
      if (error) {
        console.error("Error fetching guide rating:", error);
        throw error;
      }
      
      console.log('Summary data:', data); // Debug: Add console.log as requested
      if (data) {
        console.log(`Raw data received for guide ${guideId}:`, data);
        console.log(`Data types - average_rating: ${typeof data.average_rating}, total_reviews: ${typeof data.total_reviews}`);
        setAverageRating(data.average_rating || 0);
        setReviewCount(data.total_reviews || 0);
        console.log(`Updated rating for guide ${guideId}:`, data.average_rating, data.total_reviews);
      }
    } catch (err) {
      console.error('Error in fetchRatingData:', err);
      // Keep existing values on error
    } finally {
      setIsLoading(false);
    }
  }, [guideId]);

  // Listen for rating update events
  useEffect(() => {
    const handleRatingUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.guideId === guideId) {
        console.log(`Guide rating update event received for ${guideId}`);
        fetchRatingData();
      }
    };

    // Add event listener with correct type casting
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
    isLoading,
    refreshRating: fetchRatingData,
  };
};

// Utility function to trigger rating update events
export const triggerGuideRatingUpdate = (guideId: string) => {
  if (!guideId) return;
  
  console.log('Dispatching event for guide:', guideId); // Debug: Add console.log as requested
  const event = new CustomEvent('guideRatingUpdated', {
    detail: { guideId }
  });
  console.log('Event detail:', event.detail); // Debug: Add console.log as requested
  window.dispatchEvent(event);
};