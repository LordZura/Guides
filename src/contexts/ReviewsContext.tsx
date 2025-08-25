import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
  content: string;
  created_at: string;
  tour_id?: string;
  tour_name?: string;
}

interface ReviewsContextType {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingCounts: Record<number, number>;
  isLoading: boolean;
  error: string | null;
  hasMoreReviews: boolean;
  loadMoreReviews: () => Promise<void>;
  addReview: (review: Omit<Review, 'id' | 'created_at'>) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
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
      
      // Fetch reviews
      let query = supabase
        .from('reviews')
        .select(`
          *,
          reviewers:profiles(full_name, avatar_url),
          tours:tours(title)
        `)
        .eq('target_id', id)
        .eq('target_type', type)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Fetch the summary statistics in a separate call
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_review_summary', { target_id_param: id, target_type_param: type });
      
      if (summaryError) throw summaryError;
      
      // Transform data to match Review interface
      const transformedReviews = data.map((item: any): Review => ({
        id: item.id,
        reviewer_id: item.reviewer_id,
        reviewer_name: item.reviewers?.full_name || 'Anonymous',
        reviewer_avatar: item.reviewers?.avatar_url || undefined,
        target_id: item.target_id,
        target_type: item.target_type,
        rating: item.rating,
        content: item.content,
        created_at: item.created_at,
        tour_id: item.tour_id,
        tour_name: item.tours?.title,
      }));
      
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
  
  // Add a new review
  const addReview = async (review: Omit<Review, 'id' | 'created_at'>) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .insert([review])
        .select();
      
      if (error) throw error;
      
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
    loadMoreReviews,
    addReview,
    deleteReview,
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