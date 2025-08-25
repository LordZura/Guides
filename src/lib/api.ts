import { supabase } from './supabaseClient';
import { Tour, TourWithGuide, TourWithStatus } from './types';

// Create a more efficient queries helper for fetching data
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

// This is a placeholder for a potential RPC function
// Keeping it commented out to avoid the unused variable warning
/*
const createRpcQuery = (rpcName: string, params: any) => {
  return supabase.rpc(rpcName, params);
}
*/