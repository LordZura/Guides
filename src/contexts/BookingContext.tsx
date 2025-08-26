import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { useToast } from '@chakra-ui/react';

export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'paid' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  tour_id: string;
  tourist_id: string;
  guide_id: string;
  status: BookingStatus;
  party_size: number;
  booking_date: string;
  preferred_time: string;
  notes: string | null;
  total_price: number;
  created_at: string;
  updated_at: string;
  
  // Joined fields
  tour_title?: string;
  tour_location?: string;
  tourist_name?: string;
  tourist_avatar?: string;
  guide_name?: string;
  guide_avatar?: string;
}

interface BookingContextType {
  incomingBookings: Booking[];
  outgoingBookings: Booking[];
  isLoading: boolean;
  error: string | null;
  createBooking: (bookingData: Partial<Booking>) => Promise<{ success: boolean; error?: string; booking?: Booking }>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  hasCompletedTour: (tourId: string) => Promise<boolean>;
  hasCompletedGuideBooking: (guideId: string) => Promise<boolean>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider = ({ children }: { children: ReactNode }) => {
  const { user, profile } = useAuth();
  const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
  const [outgoingBookings, setOutgoingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Fetch bookings when user profile changes
  useEffect(() => {
    if (profile) {
      refreshBookings();
    }
  }, [profile]);

  // Fetch user's bookings
  const refreshBookings = async () => {
    if (!user || !profile) {
      setIncomingBookings([]);
      setOutgoingBookings([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Determine which bookings to fetch based on user role
      if (profile.role === 'guide') {
        // Guides see bookings for their tours
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            tours!tour_id(title, location),
            profiles!tourist_id(full_name, avatar_url)
          `)
          .eq('guide_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        // Transform the data to match the expected format
        const transformedData = data?.map(booking => ({
          ...booking,
          tour_title: booking.tours?.title || 'Unknown Tour',
          tour_location: booking.tours?.location || 'Unknown Location',
          tourist_name: booking.profiles?.full_name || 'Unknown Tourist',
          tourist_avatar: booking.profiles?.avatar_url || null
        })) || [];
        
        setIncomingBookings(transformedData);
        setOutgoingBookings([]);
      } else {
        // Tourists see bookings they've made
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select(`
            *,
            tours!tour_id(title, location),
            profiles!guide_id(full_name, avatar_url)
          `)
          .eq('tourist_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        
        // Transform the data to match the expected format
        const transformedData = data?.map(booking => ({
          ...booking,
          tour_title: booking.tours?.title || 'Unknown Tour',
          tour_location: booking.tours?.location || 'Unknown Location',
          guide_name: booking.profiles?.full_name || 'Unknown Guide',
          guide_avatar: booking.profiles?.avatar_url || null
        })) || [];
        
        setOutgoingBookings(transformedData);
        setIncomingBookings([]);
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
      toast({
        title: 'Error loading bookings',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new booking
  const createBooking = async (bookingData: Partial<Booking>) => {
    if (!user) {
      return { 
        success: false, 
        error: 'You must be logged in to book a tour' 
      };
    }

    try {
      console.debug('Creating booking with data:', bookingData);
      
      // Make sure we have the current timestamp for created_at and updated_at
      const timestamp = new Date().toISOString();
      const finalBookingData = {
        ...bookingData,
        created_at: timestamp,
        updated_at: timestamp
      };
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(finalBookingData)
        .select()
        .single();

      if (error) {
        console.error('Supabase booking insert error:', error);
        throw error;
      }

      console.debug('Booking created successfully:', data);
      
      // Update local state
      setOutgoingBookings(prev => [data as Booking, ...prev]);

      return { 
        success: true,
        booking: data as Booking
      };
    } catch (err: any) {
      console.error('Error creating booking:', err);
      // Log detailed error information for debugging
      if (err.details) console.error('Error details:', err.details);
      if (err.hint) console.error('Error hint:', err.hint);
      
      return { 
        success: false, 
        error: err.message || 'Failed to create booking'
      };
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: string, status: BookingStatus) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'You must be logged in to update a booking',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      const timestamp = new Date().toISOString();
      
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status, 
          updated_at: timestamp 
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Update local state based on user role
      if (profile?.role === 'guide') {
        setIncomingBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status, updated_at: timestamp } 
              : booking
          )
        );
      } else {
        setOutgoingBookings(prev => 
          prev.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status, updated_at: timestamp } 
              : booking
          )
        );
      }

      return true;
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      toast({
        title: 'Error updating booking',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };

  // Check if user has completed a specific tour
  const hasCompletedTour = async (tourId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('tourist_id', user.id)
        .eq('tour_id', tourId)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking tour completion:', err);
      return false;
    }
  };

  // Check if user has completed a tour with a specific guide
  const hasCompletedGuideBooking = async (guideId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .eq('tourist_id', user.id)
        .eq('guide_id', guideId)
        .eq('status', 'completed')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking guide tour completion:', err);
      return false;
    }
  };

  const value = {
    incomingBookings,
    outgoingBookings,
    isLoading,
    error,
    createBooking,
    updateBookingStatus,
    refreshBookings,
    hasCompletedTour,
    hasCompletedGuideBooking,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBookings = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
};