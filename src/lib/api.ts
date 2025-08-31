import { supabase } from './supabaseClient';
import {
  Tour,
  TourWithGuide,
  TourWithStatus,
  GuideProfile,
} from './types';

export type { Tour, TourWithGuide, TourWithStatus, GuideProfile };

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
// Update the getGuideProfile function to properly fetch and update guide ratings

// Inside the existing getGuideProfile function:
export const getGuideProfile = async (guideId: string): Promise<{
  profile: GuideProfile;
  tours: TourWithStatus[];
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
    
    // Transform tours to include status
    const tours = toursData ? toursData.map((tour): TourWithStatus => ({
      ...tour,
      status: 'active', // Default status for now, could be calculated based on dates
    })) : [];
    
    // Create guide profile (removed rating stats)
    const guideProfile: GuideProfile = {
      ...profileData,
      completed_tours_count: tours.filter(t => t.status === 'completed').length || 0,
    };
    
    return {
      profile: guideProfile,
      tours,
    };
  } catch (error) {
    console.error('Error fetching guide profile:', error);
    throw error;
  }
};

// Reviews functionality removed