import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';

import { supabase, Profile, UserRole } from '../lib/supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone: string, role: UserRole) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch or create a profile for the user
  const getOrCreateProfile = async (user: User, metadata?: { fullName?: string, phone?: string, role?: UserRole }) => {
    try {
      // First try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If profile exists, return it
      if (existingProfile) {
        console.log('Found existing profile');
        return existingProfile as Profile;
      }

      // If there was a "not found" error, create profile
      if (fetchError && fetchError.code === 'PGRST116') {
        console.log('No profile found, creating new profile');
        
        // Get metadata from user if available, or use provided metadata
        const userMetadata = user.user_metadata || {};
        
        // Prepare profile data
        const profileData = {
          id: user.id,
          full_name: metadata?.fullName || userMetadata.full_name || '',
          phone: metadata?.phone || userMetadata.phone || null,
          role: (metadata?.role || userMetadata.role || 'tourist') as UserRole,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert profile with 3 retries with exponential backoff
        let insertError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data, error } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (!error) {
            console.log('Profile created successfully on attempt', attempt + 1);
            return data as Profile;
          }
          
          insertError = error;
          
          if (error.code === 'PGRST116') {
            // Row likely already exists - no need to retry
            break;
          }
          
          if (error.code === '23503') { // Foreign key violation
            console.log('Foreign key constraint, waiting before retry');
            // Exponential backoff: 500ms, 1s, 2s
            await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
            continue;
          }
          
          // Other error, break the loop
          break;
        }

        console.error('Failed to create profile after retries:', insertError);
        return null;
      }

      console.error('Error fetching profile:', fetchError);
      return null;
    } catch (error) {
      console.error('Exception in getOrCreateProfile:', error);
      return null;
    }
  };

  // Initialize auth state on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        
        // Get or create profile for user
        const profile = await getOrCreateProfile(session.user);
        setProfile(profile);
      }
      
      setIsLoading(false);
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Get or create profile when user signs in
            const profile = await getOrCreateProfile(session.user);
            setProfile(profile);
          } else {
            setProfile(null);
          }
          
          setIsLoading(false);
        }
      );
      
      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    };
    
    initializeAuth();
  }, []);

  // Sign up with email and password - now simpler, just handle auth
  const signUp = async (email: string, password: string, fullName: string, phone: string, role: UserRole) => {
    try {
      console.log('Starting signup process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Store user metadata for later profile creation
          data: {
            full_name: fullName,
            phone,
            role,
          }
        }
      });

      if (error) {
        console.error('Supabase auth signup error:', error);
        return { error };
      }

      console.log('User signed up successfully!', data);
      // No profile creation here - we'll create it when they sign in
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      return { error: error as AuthError };
    }
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Profile will be created or fetched via the auth state change handler
      return { error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      return { error: error as AuthError };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Exception during sign out:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};