import { Profile } from './supabaseClient';

export interface Tour {
  id: string;
  title: string;
  description: string;
  location: string;
  duration: number; // In hours
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

export interface TourWithStatus extends Tour {
  booking_status?: 'booked' | 'pending' | 'available';
  booked_count?: number;
}

export interface TourWithGuide extends Tour {
  guide?: Profile;
}