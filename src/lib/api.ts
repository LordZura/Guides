import { supabase } from './supabaseClient';
import {
  Tour,
  TourWithGuide,
  TourWithStatus,
  Review,
  GuideProfile,
} from './types';

export type { Tour, TourWithGuide, TourWithStatus, Review, GuideProfile };

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
    
    // Modified: Fetch reviews for this guide without using foreign key relationships
    // Instead of using foreign key joins, we'll do separate queries
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
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
    
    // Fetch reviewer information separately
    let reviews: Review[] = [];
    
    if (reviewsData && reviewsData.length > 0) {
      // Get unique reviewer IDs
      const reviewerIds = [...new Set(reviewsData.map(review => review.reviewer_id))];
      
      // Fetch reviewer profiles
      const { data: reviewerProfiles, error: reviewerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds);
      
      if (reviewerError) throw reviewerError;
      
      // Create a map of reviewer profiles for quick lookup
      const reviewerMap = new Map();
      if (reviewerProfiles) {
        reviewerProfiles.forEach(profile => {
          reviewerMap.set(profile.id, profile);
        });
      }
      
      // Fetch tour information separately
      const tourIds = [...new Set(reviewsData.filter(review => review.tour_id).map(review => review.tour_id))];
      
      let tourMap = new Map();
      if (tourIds.length > 0) {
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('id, title')
          .in('id', tourIds);
        
        if (tourError) throw tourError;
        
        if (tourData) {
          tourData.forEach(tour => {
            tourMap.set(tour.id, tour);
          });
        }
      }
      
      // Transform reviews data - UPDATED: content to comment
      reviews = reviewsData.map((item): Review => {
        const reviewer = reviewerMap.get(item.reviewer_id);
        const tour = item.tour_id ? tourMap.get(item.tour_id) : null;
        
        return {
          id: item.id,
          reviewer_id: item.reviewer_id,
          reviewer_name: reviewer ? reviewer.full_name : 'Anonymous',
          reviewer_avatar: reviewer ? reviewer.avatar_url : undefined,
          target_id: item.target_id,
          target_type: item.target_type,
          rating: item.rating,
          comment: item.comment, // Changed from 'content' to 'comment'
          created_at: item.created_at,
          tour_id: item.tour_id,
          tour_name: tour ? tour.title : undefined,
        };
      });
    }
    
    // Transform tours to include status
    const tours = toursData ? toursData.map((tour): TourWithStatus => ({
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

// Get reviews for a guide or tour - Modified to avoid foreign key joins
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
      .select('*', { count: 'exact' })
      .eq('target_id', targetId)
      .eq('target_type', targetType)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    let reviews: Review[] = [];
    
    if (data && data.length > 0) {
      // Get unique reviewer IDs
      const reviewerIds = [...new Set(data.map(review => review.reviewer_id))];
      
      // Fetch reviewer profiles
      const { data: reviewerProfiles, error: reviewerError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', reviewerIds);
      
      if (reviewerError) throw reviewerError;
      
      // Create a map of reviewer profiles for quick lookup
      const reviewerMap = new Map();
      if (reviewerProfiles) {
        reviewerProfiles.forEach(profile => {
          reviewerMap.set(profile.id, profile);
        });
      }
      
      // Fetch tour information separately
      const tourIds = [...new Set(data.filter(review => review.tour_id).map(review => review.tour_id))];
      
      let tourMap = new Map();
      if (tourIds.length > 0) {
        const { data: tourData, error: tourError } = await supabase
          .from('tours')
          .select('id, title')
          .in('id', tourIds);
        
        if (tourError) throw tourError;
        
        if (tourData) {
          tourData.forEach(tour => {
            tourMap.set(tour.id, tour);
          });
        }
      }
      
      // Transform reviews data - UPDATED: content to comment
      reviews = data.map((item): Review => {
        const reviewer = reviewerMap.get(item.reviewer_id);
        const tour = item.tour_id ? tourMap.get(item.tour_id) : null;
        
        return {
          id: item.id,
          reviewer_id: item.reviewer_id,
          reviewer_name: reviewer ? reviewer.full_name : 'Anonymous',
          reviewer_avatar: reviewer ? reviewer.avatar_url : undefined,
          target_id: item.target_id,
          target_type: item.target_type,
          rating: item.rating,
          comment: item.comment, // Changed from 'content' to 'comment'
          created_at: item.created_at,
          tour_id: item.tour_id,
          tour_name: tour ? tour.title : undefined,
        };
      });
    }
    
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