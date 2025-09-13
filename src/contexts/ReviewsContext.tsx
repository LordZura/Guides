import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '@chakra-ui/react';
import { useNotifications } from './NotificationContext';
import { triggerGuideRatingUpdate } from '../hooks/useGuideRating';

export interface Review {
  id: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  target_id: string;
  target_type: 'guide' | 'tour';
  rating: number;
  comment: string;
  created_at: string;
  tour_id?: string;
  tour_name?: string;
}

interface ReviewData {
  reviewer_id: string;
  target_id: string;
  target_type: 'guide' | 'tour';
  rating: number;
  comment: string;
  tour_id?: string;
}

interface ReviewsContextType {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  hasMoreReviews: boolean;
  loadReviews: (id: string, type: 'guide' | 'tour', page?: number) => Promise<void>;
  addReview: (review: ReviewData) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  refreshReviews: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

const PAGE_SIZE = 10;

/**
 * Clean ReviewsProvider - recreated with simple logic
 */
export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const { createNotification } = useNotifications();
  const toast = useToast();

  // Simple state management
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);
  const [currentTarget, setCurrentTarget] = useState<{ id: string; type: 'guide' | 'tour' } | null>(null);

  /**
   * Load reviews for a target (guide or tour)
   */
  const loadReviews = useCallback(async (
    id: string, 
    type: 'guide' | 'tour', 
    page: number = 0
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Reset if new target
      if (!currentTarget || currentTarget.id !== id || currentTarget.type !== type) {
        setReviews([]);
        setCurrentTarget({ id, type });
      }

      // Fetch reviews with pagination
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('target_id', id)
        .eq('target_type', type)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (reviewsError) throw reviewsError;

      // Get reviewer profiles
      if (reviewsData && reviewsData.length > 0) {
        const reviewerIds = reviewsData.map(r => r.reviewer_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', reviewerIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        // Get tour names if needed
        const tourIds = reviewsData.filter(r => r.tour_id).map(r => r.tour_id);
        let tourMap = new Map();
        if (tourIds.length > 0) {
          const { data: toursData } = await supabase
            .from('tours')
            .select('id, title')
            .in('id', tourIds);
          tourMap = new Map(toursData?.map(t => [t.id, t]) || []);
        }

        // Transform reviews with profile data
        const transformedReviews: Review[] = reviewsData.map(item => {
          const reviewer = profileMap.get(item.reviewer_id);
          const tour = item.tour_id ? tourMap.get(item.tour_id) : null;
          
          return {
            id: item.id,
            reviewer_id: item.reviewer_id,
            reviewer_name: reviewer?.full_name || 'Anonymous',
            reviewer_avatar: reviewer?.avatar_url,
            target_id: item.target_id,
            target_type: item.target_type,
            rating: item.rating,
            comment: item.comment,
            created_at: item.created_at,
            tour_id: item.tour_id,
            tour_name: tour?.title,
          };
        });

        // Update reviews list
        if (page === 0) {
          setReviews(transformedReviews);
        } else {
          setReviews(prev => [...prev, ...transformedReviews]);
        }

        setHasMoreReviews(transformedReviews.length === PAGE_SIZE);
      } else {
        setReviews([]);
        setHasMoreReviews(false);
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [currentTarget]);

  /**
   * Add a new review
   */
  const addReview = async (reviewData: ReviewData) => {
    setIsLoading(true);
    try {
      // Insert review
      const { error } = await supabase
        .from('reviews')
        .insert([reviewData])
        .select()
        .single();

      if (error) throw error;

      // Send notification
      if (reviewData.target_type === 'tour') {
        // Get tour creator for notification
        const { data: tourData } = await supabase
          .from('tours')
          .select('creator_id, title')
          .eq('id', reviewData.target_id)
          .single();

        if (tourData) {
          await createNotification({
            type: 'tour_rated',
            actor_id: reviewData.reviewer_id,
            recipient_id: tourData.creator_id,
            target_type: 'tour',
            target_id: reviewData.target_id,
            message: `Someone rated your tour "${tourData.title}" ${reviewData.rating} stars`,
            action_url: null
          });

          // Trigger guide rating update
          triggerGuideRatingUpdate(tourData.creator_id);
        }
      } else if (reviewData.target_type === 'guide') {
        await createNotification({
          type: 'tour_rated',
          actor_id: reviewData.reviewer_id,
          recipient_id: reviewData.target_id,
          target_type: 'guide',
          target_id: reviewData.target_id,
          message: `Someone rated your guide services ${reviewData.rating} stars`,
          action_url: null
        });

        // Trigger guide rating update
        triggerGuideRatingUpdate(reviewData.target_id);
      }

      // Refresh reviews
      if (currentTarget) {
        await loadReviews(currentTarget.id, currentTarget.type, 0);
      }

      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error adding review:', err);
      toast({
        title: 'Failed to submit review',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Delete a review
   */
  const deleteReview = async (reviewId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      // Remove from local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));

      toast({
        title: 'Review deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error deleting review:', err);
      toast({
        title: 'Failed to delete review',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh current reviews
   */
  const refreshReviews = async () => {
    if (currentTarget) {
      await loadReviews(currentTarget.id, currentTarget.type, 0);
    }
  };

  const value = {
    reviews,
    isLoading,
    error,
    hasMoreReviews,
    loadReviews,
    addReview,
    deleteReview,
    refreshReviews,
  };

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
};

/**
 * Hook to use the reviews context
 */
export const useReviews = (id?: string, type?: 'guide' | 'tour') => {
  const context = useContext(ReviewsContext);
  
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  
  // Auto-load reviews if id and type provided
  React.useEffect(() => {
    if (id && type) {
      context.loadReviews(id, type);
    }
  }, [id, type, context]);
  
  return context;
};