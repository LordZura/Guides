// Move this file to src/lib/supabaseClient.ts to match imports
import { createClient } from '@supabase/supabase-js';

// Support either env name to avoid surprises
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  (import.meta.env.VITE_SUPABASE_KEY as string);

// Validate but don't crash
if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set. Add it to your .env or .env.local.');
}
if (!supabaseAnonKey) {
  console.error('Supabase anon key is not set. Use VITE_SUPABASE_ANON_KEY (preferred) or VITE_SUPABASE_KEY.');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');

export type UserRole = 'guide' | 'tourist';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_AVATAR_URL =
  'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';