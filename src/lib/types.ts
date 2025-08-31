import { Profile } from './supabaseClient';

export interface TourLocation {
  id: string;
  name: string;
  notes?: string;
  order: number;
}

export interface TourTemplate {
  id: string;
  name: string;
  description: string;
  template_data: TourTemplateData;
  is_system_template: boolean;
  creator_id: string | null;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface TourTemplateData {
  title: string;
  description: string;
  duration: number;
  price: number;
  capacity: number;
  languages: string[];
  days_available: boolean[];
  is_private: boolean;
  locations: TourLocation[];
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  location: string; // Keep for backward compatibility
  locations?: TourLocation[]; // New array for multiple locations
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
  status?: 'active' | 'upcoming' | 'completed' | 'cancelled';
}

export interface TourWithGuide extends Tour {
  guide?: Profile;
}

export interface GuideProfile extends Profile {
  completed_tours_count: number;
}