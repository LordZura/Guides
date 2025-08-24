import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';

// Types
export interface TourWithLanguages {
  id: string;
  title: string;
  description: string;
  average_price: number;
  location: string;
  creator_id: string;
  creator_role: 'guide' | 'tourist';
  capacity: number | null;
  is_active: boolean;
  languages?: string[];
  available_days?: number[];
}

interface TourCreateData {
  title: string;
  description: string;
  average_price: number;
  location: string;
  capacity?: number | null;
  languages?: string[];
  available_days?: number[];
}

interface OperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

interface ToursContextType {
  userTours: TourWithLanguages[];
  isLoading: boolean;
  error: string | null;
  refreshTours: () => Promise<void>;
  createTour: (data: TourCreateData) => Promise<OperationResult>;
  updateTour: (id: string, data: Partial<TourCreateData>) => Promise<OperationResult>;
  deleteTour: (id: string) => Promise<OperationResult>;
  getTourById: (id: string) => Promise<TourWithLanguages | null>;
  getPublicTours: (filters?: any) => Promise<TourWithLanguages[]>;
}

// Create the context
const ToursContext = createContext<ToursContextType | undefined>(undefined);

// Provider component
export const ToursProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [userTours, setUserTours] = useState<TourWithLanguages[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tours for the current user
  const fetchUserTours = async () => {
    if (!user) {
      setUserTours([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`Fetching tours for user ${user.id} with role ${profile?.role}`);

      // Fetch basic tour data
      const { data: toursData, error: toursError } = await supabase
        .from('tours')
        .select('*')
        .eq('creator_id', user.id)
        .order('updated_at', { ascending: false });

      if (toursError) throw toursError;

      // Enhanced tours with languages and available days
      const enhancedTours: TourWithLanguages[] = [];

      // Process each tour to add languages and available days
      for (const tour of toursData || []) {
        const tourWithDetails = { ...tour } as TourWithLanguages;

        // Fetch languages for this tour
        const { data: languageData, error: languageError } = await supabase
          .from('tour_languages')
          .select('languages(name)')
          .eq('tour_id', tour.id);

        if (languageError) throw languageError;

        // Extract language names
        tourWithDetails.languages = languageData?.map(item => {
          // Handle nested data shape
          const languages = item.languages as any;
          return languages?.name || '';
        }).filter(Boolean) || [];

        // Fetch available days
        const { data: daysData, error: daysError } = await supabase
          .from('tour_available_days')
          .select('day_of_week')
          .eq('tour_id', tour.id);

        if (daysError) throw daysError;

        // Extract day numbers
        tourWithDetails.available_days = daysData?.map(item => 
          Number(item.day_of_week)
        ) || [];

        enhancedTours.push(tourWithDetails);
      }

      setUserTours(enhancedTours);
      console.log('User tours loaded:', enhancedTours.length);
    } catch (err: any) {
      console.error('Error fetching tours:', err);
      setError(err.message || 'Failed to load tours');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh tours data
  const refreshTours = async () => {
    await fetchUserTours();
  };

  // Create a new tour
  const createTour = async (data: TourCreateData): Promise<OperationResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log('Creating new tour with data:', data);

      // Insert basic tour data
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .insert([{
          title: data.title,
          description: data.description,
          average_price: data.average_price,
          location: data.location,
          capacity: data.capacity || null,
          creator_id: user.id,
          creator_role: profile?.role || 'tourist',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (tourError) throw tourError;

      const tourId = tourData.id;
      console.log('Tour created with ID:', tourId);

      // Insert language associations if provided
      if (data.languages && data.languages.length > 0) {
        // First, get language IDs
        const { data: languagesData, error: languagesError } = await supabase
          .from('languages')
          .select('id, name')
          .in('name', data.languages);

        if (languagesError) throw languagesError;

        // Create language associations
        const languageAssociations = languagesData.map((lang: any) => ({
          tour_id: tourId,
          language_id: lang.id
        }));

        if (languageAssociations.length > 0) {
          const { error: assocError } = await supabase
            .from('tour_languages')
            .insert(languageAssociations);

          if (assocError) throw assocError;
        }
      }

      // Insert available days if provided
      if (data.available_days && data.available_days.length > 0) {
        const dayAssociations = data.available_days.map(day => ({
          tour_id: tourId,
          day_of_week: day
        }));

        const { error: daysError } = await supabase
          .from('tour_available_days')
          .insert(dayAssociations);

        if (daysError) throw daysError;
      }

      // Refresh tours list
      refreshTours();

      return { success: true, data: tourId };
    } catch (err: any) {
      console.error('Error creating tour:', err);
      return { success: false, error: err.message || 'Failed to create tour' };
    }
  };

  // Update an existing tour
  const updateTour = async (id: string, data: Partial<TourCreateData>): Promise<OperationResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log(`Updating tour ${id} with data:`, data);

      // Update basic tour data
      const tourUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Add fields that were provided
      if (data.title !== undefined) tourUpdates.title = data.title;
      if (data.description !== undefined) tourUpdates.description = data.description;
      if (data.average_price !== undefined) tourUpdates.average_price = data.average_price;
      if (data.location !== undefined) tourUpdates.location = data.location;
      if (data.capacity !== undefined) tourUpdates.capacity = data.capacity;

      const { error: tourError } = await supabase
        .from('tours')
        .update(tourUpdates)
        .eq('id', id)
        .eq('creator_id', user.id); // Safety check

      if (tourError) throw tourError;

      // Update languages if provided
      if (data.languages !== undefined) {
        // First, delete existing associations
        const { error: deleteError } = await supabase
          .from('tour_languages')
          .delete()
          .eq('tour_id', id);

        if (deleteError) throw deleteError;

        // Then create new ones if there are languages
        if (data.languages.length > 0) {
          // Get language IDs
          const { data: languagesData, error: languagesError } = await supabase
            .from('languages')
            .select('id, name')
            .in('name', data.languages);

          if (languagesError) throw languagesError;

          // Create new associations
          const languageAssociations = languagesData.map((lang: any) => ({
            tour_id: id,
            language_id: lang.id
          }));

          if (languageAssociations.length > 0) {
            const { error: assocError } = await supabase
              .from('tour_languages')
              .insert(languageAssociations);

            if (assocError) throw assocError;
          }
        }
      }

      // Update available days if provided
      if (data.available_days !== undefined) {
        // First, delete existing days
        const { error: deleteDaysError } = await supabase
          .from('tour_available_days')
          .delete()
          .eq('tour_id', id);

        if (deleteDaysError) throw deleteDaysError;

        // Then create new ones if there are days
        if (data.available_days.length > 0) {
          const dayAssociations = data.available_days.map(day => ({
            tour_id: id,
            day_of_week: day
          }));

          const { error: daysError } = await supabase
            .from('tour_available_days')
            .insert(dayAssociations);

          if (daysError) throw daysError;
        }
      }

      // Refresh tours list
      refreshTours();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating tour:', err);
      return { success: false, error: err.message || 'Failed to update tour' };
    }
  };

  // Delete a tour
  const deleteTour = async (id: string): Promise<OperationResult> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      console.log(`Deleting tour ${id}`);

      // First delete associated records to avoid foreign key constraints
      // Delete language associations
      const { error: langError } = await supabase
        .from('tour_languages')
        .delete()
        .eq('tour_id', id);

      if (langError) throw langError;

      // Delete available days
      const { error: daysError } = await supabase
        .from('tour_available_days')
        .delete()
        .eq('tour_id', id);

      if (daysError) throw daysError;

      // Delete the tour itself
      const { error: tourError } = await supabase
        .from('tours')
        .delete()
        .eq('id', id)
        .eq('creator_id', user.id); // Safety check

      if (tourError) throw tourError;

      // Refresh tours list
      refreshTours();

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting tour:', err);
      return { success: false, error: err.message || 'Failed to delete tour' };
    }
  };

  // Get a specific tour by ID
  const getTourById = async (id: string): Promise<TourWithLanguages | null> => {
    try {
      // Get the tour basic data
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', id)
        .single();

      if (tourError) throw tourError;

      // Fetch languages for this tour
      const { data: languageData, error: languageError } = await supabase
        .from('tour_languages')
        .select('languages(name)')
        .eq('tour_id', id);

      if (languageError) throw languageError;

      // Extract language names
      const languages = languageData?.map(item => {
        const lang = item.languages as any;
        return lang?.name || '';
      }).filter(Boolean) || [];

      // Fetch available days
      const { data: daysData, error: daysError } = await supabase
        .from('tour_available_days')
        .select('day_of_week')
        .eq('tour_id', id);

      if (daysError) throw daysError;

      // Extract day numbers
      const availableDays = daysData?.map(item => 
        Number(item.day_of_week)
      ) || [];

      // Return complete tour with details
      return {
        ...tourData,
        languages,
        available_days: availableDays
      };
    } catch (err) {
      console.error(`Error fetching tour ${id}:`, err);
      return null;
    }
  };

  // Get public tours with optional filters
  const getPublicTours = async (filters?: any): Promise<TourWithLanguages[]> => {
    try {
      let query = supabase
        .from('tours')
        .select('*')
        .eq('is_active', true);

      // Apply filters if provided
      if (filters) {
        if (filters.location) {
          query = query.ilike('location', `%${filters.location}%`);
        }
        
        if (filters.minPrice !== undefined) {
          query = query.gte('average_price', filters.minPrice);
        }
        
        if (filters.maxPrice !== undefined) {
          query = query.lte('average_price', filters.maxPrice);
        }
        
        if (filters.creatorRole) {
          query = query.eq('creator_role', filters.creatorRole);
        }
      }

      const { data: toursData, error: toursError } = await query.order('created_at', { ascending: false });

      if (toursError) throw toursError;

      // Process each tour to include languages and available days
      const enhancedTours: TourWithLanguages[] = [];
      for (const tour of toursData || []) {
        const fullTour = await getTourById(tour.id);
        if (fullTour) enhancedTours.push(fullTour);
      }

      return enhancedTours;
    } catch (err) {
      console.error('Error fetching public tours:', err);
      return [];
    }
  };

  // Fetch tours on initial load or when user/profile changes
  useEffect(() => {
    fetchUserTours();
  }, [user, profile]);

  // Context value
  const value: ToursContextType = {
    userTours,
    isLoading,
    error,
    refreshTours,
    createTour,
    updateTour,
    deleteTour,
    getTourById,
    getPublicTours
  };

  return (
    <ToursContext.Provider value={value}>
      {children}
    </ToursContext.Provider>
  );
};

// Custom hook to use the tours context
export const useTours = (): ToursContextType => {
  const context = useContext(ToursContext);
  if (context === undefined) {
    throw new Error('useTours must be used within a ToursProvider');
  }
  return context;
};