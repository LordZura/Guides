import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthProvider';
import { useToast } from '@chakra-ui/react';

export interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
  creator_id: string;
  creator_role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ToursContextType {
  tours: Tour[];
  isLoading: boolean;
  error: string | null;
  refreshTours: () => Promise<void>;
  deleteTour: (id: string) => Promise<void>;
  updateTourStatus: (id: string, isActive: boolean) => Promise<void>;
}

const ToursContext = createContext<ToursContextType | undefined>(undefined);

export const ToursProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [tours, setTours] = useState<Tour[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchTours = async () => {
    if (!profile) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch tours created by the current user
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('creator_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setTours(data || []);
    } catch (err: any) {
      console.error('Error fetching tours:', err);
      setError(err.message || 'Failed to load tours');
      toast({
        title: 'Error loading tours',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTours();
  }, [profile]);

  const refreshTours = async () => {
    await fetchTours();
  };

  const deleteTour = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tours')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTours(tours.filter(tour => tour.id !== id));
      
      toast({
        title: 'Tour deleted',
        description: 'The tour has been successfully deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error deleting tour:', err);
      toast({
        title: 'Error deleting tour',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const updateTourStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('tours')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setTours(tours.map(tour => 
        tour.id === id ? { ...tour, is_active: isActive } : tour
      ));
      
      toast({
        title: `Tour ${isActive ? 'activated' : 'deactivated'}`,
        description: `The tour is now ${isActive ? 'visible to users' : 'hidden from users'}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error updating tour status:', err);
      toast({
        title: 'Error updating tour',
        description: err.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const value = {
    tours,
    isLoading,
    error,
    refreshTours,
    deleteTour,
    updateTourStatus,
  };

  return <ToursContext.Provider value={value}>{children}</ToursContext.Provider>;
};

export const useTours = () => {
  const context = useContext(ToursContext);
  if (context === undefined) {
    throw new Error('useTours must be used within a ToursProvider');
  }
  return context;
};