import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '@chakra-ui/react';

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
  id?: string;
  reviewer_id: string;
  target_id: string;
  target_type: 'guide' | 'tour';
  rating: number;
  comment: string;
  created_at?: string;
  tour_id?: string;
}

interface ReviewsContextType {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
  isLoading: boolean;
  error: string | null;
  hasMoreReviews: boolean;
  loadReviews: (id: string, type: 'guide' | 'tour', page?: number) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  addReview: (review: ReviewData) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  refreshReviews: () => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export const ReviewsProvider = ({ children }: { children: ReactNode }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);
  const [ratingCounts, setRatingCounts] = useState<Record<number, number>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreReviews, setHasMoreReviews] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'guide' | 'tour' | null>(null);
  
  const toast = useToast();
  const PAGE_SIZE = 5;
  
  // Subscribe to realtime changes in reviews
  useEffect(() => {
    if (!targetId || !targetType) return;
    
    // Set up subscription for realtime updates
    const subscription = supabase
      .channel('reviews-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'reviews',
        filter: `target_id=eq.${targetId}`,
      }, () => {
        // Refresh the reviews when changes occur
        loadReviews(targetId, targetType, 0);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [targetId, targetType]);
  
  // Load reviews for a specific target (guide or tour)
  const loadReviews = useCallback(async (
    id: string, 
    type: 'guide' | 'tour', 
    page: number = 0
  ) => {
    if (id !== targetId || type !== targetType) {
      // Reset state if target changed
      setReviews([]);
      setCurrentPage(0);
      setTargetId(id);
      setTargetType(type);
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // First fetch the basic review data without joins
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('target_id', id)
        .eq('target_type', type)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      if (reviewsError) throw reviewsError;
      
      // Fetch the summary statistics
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_review_summary', { target_id_param: id, target_type_param: type });
      
      if (summaryError) throw summaryError;
      
      // Get all reviewer IDs to fetch their profiles
      const reviewerIds = reviewsData.map(review => review.reviewer_id);
      
      // Fetch reviewer profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds);
      
      if (profilesError) throw profilesError;
      
      // Create a map of reviewer profiles
      const profileMap = new Map();
      profilesData.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
      
      // Get all tour IDs to fetch tour names
      const tourIds = reviewsData
        .filter(review => review.tour_id)
        .map(review => review.tour_id);
      
      // If there are tour IDs, fetch tour names
      let tourMap = new Map();
      if (tourIds.length > 0) {
        const { data: toursData, error: toursError } = await supabase
          .from('tours')
          .select('id, title')
          .in('id', tourIds);
        
        if (toursError) throw toursError;
        
        toursData.forEach(tour => {
          tourMap.set(tour.id, tour);
        });
      }
      
      // Transform review data with profiles and tour info
      const transformedReviews = reviewsData.map((item): Review => {
        const reviewer = profileMap.get(item.reviewer_id);
        const tour = item.tour_id ? tourMap.get(item.tour_id) : null;
        
        return {
          id: item.id,
          reviewer_id: item.reviewer_id,
          reviewer_name: reviewer ? reviewer.full_name : 'Anonymous',
          reviewer_avatar: reviewer ? reviewer.avatar_url : undefined,
          target_id: item.target_id,
          target_type: item.target_type,
          rating: item.rating,
          comment: item.comment,
          created_at: item.created_at,
          tour_id: item.tour_id,
          tour_name: tour ? tour.title : undefined,
        };
      });
      
      // Update state
      if (page === 0) {
        setReviews(transformedReviews);
      } else {
        setReviews(prev => [...prev, ...transformedReviews]);
      }
      
      setCurrentPage(page);
      setHasMoreReviews(transformedReviews.length === PAGE_SIZE);
      
      // Update summary
      if (summaryData) {
        setAverageRating(summaryData.average_rating || 0);
        setTotalReviews(summaryData.total_reviews || 0);
        setRatingCounts(summaryData.rating_counts || {});
      }
    } catch (err: any) {
      console.error('Error loading reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType]);
  
  // Load more reviews (pagination)
  const loadMoreReviews = async () => {
    if (isLoading || !targetId || !targetType) return;
    await loadReviews(targetId, targetType, currentPage + 1);
  };

  // Refresh current reviews
  const refreshReviews = async () => {
    if (!targetId || !targetType) return;
    await loadReviews(targetId, targetType, 0);
  };
  
  // Add a new review
  const addReview = async (reviewData: ReviewData) => {
    try {
      setIsLoading(true);
      
      // Create a clean data object for insertion
      const dataToInsert = {
        reviewer_id: reviewData.reviewer_id,
        target_id: reviewData.target_id,
        target_type: reviewData.target_type,
        rating: reviewData.rating,
        comment: reviewData.comment,
      };
      
      // Only add tour_id if it exists
      if (reviewData.tour_id) {
        (dataToInsert as any).tour_id = reviewData.tour_id;
      }
      
      console.debug('Inserting review data:', dataToInsert);
      
      // Insert the review
      const { error } = await supabase
        .from('reviews')
        .insert([dataToInsert]);
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      // Refresh reviews
      if (targetId && targetType) {
        await loadReviews(targetId, targetType, 0);
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

  // Delete a review
  const deleteReview = async (reviewId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      // Update local state
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      
      // Refresh summary statistics
      if (targetId && targetType) {
        const { data, error } = await supabase
          .rpc('get_review_summary', { target_id_param: targetId, target_type_param: targetType });
        
        if (!error && data) {
          setAverageRating(data.average_rating || 0);
          setTotalReviews(data.total_reviews || 0);
          setRatingCounts(data.rating_counts || {});
        }
      }
      
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
  
  const value = {
    reviews,
    averageRating,
    totalReviews,
    ratingCounts,
    isLoading,
    error,
    hasMoreReviews,
    loadReviews,
    loadMoreReviews,
    addReview,
    deleteReview,
    refreshReviews,
  };
  
  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
};

// Custom hook to use the reviews context
export const useReviews = (id?: string, type?: 'guide' | 'tour') => {
  const context = useContext(ReviewsContext);
  
  if (context === undefined) {
    throw new Error('useReviews must be used within a ReviewsProvider');
  }
  
  // If id and type are provided, load reviews for that target
  React.useEffect(() => {
    if (id && type) {
      context.loadReviews(id, type);
    }
  }, [id, type]);
  
  return context;
};