import { supabase } from './supabaseClient';
import {
  Tour,
  TourWithGuide,
  TourWithStatus,
  Review,
  GuideProfile,
} from './types';

export type { Tour, TourWithGuide, TourWithStatus, Review, GuideProfile };
import { Profile } from './supabaseClient';

// Fetch a single tour by ID
export const fetchTourById = async (id: string): Promise<TourWithGuide | null> => {
  try {
    const { data, error } = await supabase
      .from('tours')
      .select(`
        *,
        guide:profiles!creator_id(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    
    return data as TourWithGuide;
  } catch (error) {
    console.error('Error fetching tour:', error);
    return null;
  }
};

// Fetch all tours by a guide
export const fetchToursByGuideId = async (guideId: string): Promise<Tour[]> => {
  try {
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('creator_id', guideId)
      .eq('creator_role', 'guide')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return data as Tour[];
  } catch (error) {
    console.error('Error fetching guide tours:', error);
    return [];
  }
};

// Get guide profile with tours and reviews
export const getGuideProfile = async (guideId: string): Promise<{
  profile: GuideProfile;
  tours: TourWithStatus[];
  reviews: Review[];
}> => {
  try {
    // Fetch the guide profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', guideId)
      .eq('role', 'guide')
      .single();
    
    if (profileError) throw profileError;
    
    // Fetch tours created by this guide
    const { data: toursData, error: toursError } = await supabase
      .from('tours')
      .select('*')
      .eq('creator_id', guideId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (toursError) throw toursError;
    
    // Fetch reviews for this guide
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewers:profiles(full_name, avatar_url),
        tours:tours(title)
      `)
      .eq('target_id', guideId)
      .eq('target_type', 'guide')
      .order('created_at', { ascending: false });
    
    if (reviewsError) throw reviewsError;
    
    // Get review summary
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_review_summary', { 
        target_id_param: guideId, 
        target_type_param: 'guide' 
      });
    
    if (summaryError) throw summaryError;
    
    // Transform reviews data
    const reviews = reviewsData ? reviewsData.map((item: any): Review => ({
      id: item.id,
      reviewer_id: item.reviewer_id,
      reviewer_name: item.reviewers?.full_name || 'Anonymous',
      reviewer_avatar: item.reviewers?.avatar_url,
      target_id: item.target_id,
      target_type: item.target_type,
      rating: item.rating,
      content: item.content,
      created_at: item.created_at,
      tour_id: item.tour_id,
      tour_name: item.tours?.title,
    })) : [];
    
    // Transform tours to include status
    const tours = toursData ? toursData.map((tour: any): TourWithStatus => ({
      ...tour,
      status: 'active', // Default status for now, could be calculated based on dates
    })) : [];
    
    // Create guide profile with stats
    const guideProfile: GuideProfile = {
      ...profileData,
      average_rating: summaryData?.average_rating || 0,
      reviews_count: summaryData?.total_reviews || 0,
      completed_tours_count: tours.filter(t => t.status === 'completed').length || 0,
    };
    
    return {
      profile: guideProfile,
      tours,
      reviews,
    };
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    throw error;
  }
};

// Get reviews for a guide or tour
export const getReviews = async (targetId: string, targetType: 'guide' | 'tour', page = 0, limit = 10): Promise<{
  reviews: Review[];
  totalCount: number;
  hasMore: boolean;
}> => {
  try {
    // Calculate pagination range
    const from = page * limit;
    const to = from + limit - 1;
    
    // Fetch reviews
    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewers:profiles(full_name, avatar_url),
        tours:tours(title)
      `, { count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    // Transform data
    const reviews = data ? data.map((item: any): Review => ({
      id: item.id,
      reviewer_id: item.reviewer_id,
      reviewer_name: item.reviewers?.full_name || 'Anonymous',
      reviewer_avatar: item.reviewers?.avatar_url,
      target_id: item.target_id,
      target_type: item.target_type,
      rating: item.rating,
      content: item.content,
      created_at: item.created_at,
      tour_id: item.tour_id,
      tour_name: item.tours?.title,
    })) : [];
    
    return {
      reviews,
      totalCount: count || 0,
      hasMore: count ? from + reviews.length < count : false
    };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { reviews: [], totalCount: 0, hasMore: false };
  }
};