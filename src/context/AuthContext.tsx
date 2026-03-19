import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, resetSupabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: any = null;

    const initAuth = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      console.log('initAuth checking config:', { hasUrl: !!supabaseUrl, hasKey: !!supabaseAnonKey });

      if (!supabaseUrl || !supabaseAnonKey) {
        console.error('CRITICAL: Supabase configuration missing in AuthContext!');
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Safety timeout to prevent indefinite loading
      timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Auth check taking longer than expected (20s), showing login screen...');
          setLoading(false);
        }
      }, 20000);

      try {
        // Check active sessions and sets the user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (timeoutId) clearTimeout(timeoutId);
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setLoading(false);
        }

        // Listen for changes on auth state
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, !!session?.user);
          
          const currentUser = session?.user ?? null;
          setUser(session?.user ?? null);
          
          if (event === 'SIGNED_IN' && currentUser) {
            await fetchProfile(currentUser.id);
          } else if (event === 'SIGNED_OUT') {
            setProfile(null);
            setLoading(false);
          } else if (!currentUser) {
            setLoading(false);
          }
        });
        
        subscription = data.subscription;
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error('Auth initialization error:', err);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile from DB:', error);
        if (error.code === 'PGRST116') {
          console.log('Profile missing for user, attempting to create one...');
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert([{
                id: userId,
                full_name: userData.user.user_metadata?.full_name || userData.user.email,
                role: 'admin'
              }])
              .select()
              .single();
            
            if (!createError && newProfile) {
              console.log('Profile created successfully on-the-fly');
              setProfile(newProfile);
              return;
            } else {
              console.error('Failed to create profile on-the-fly:', createError);
            }
          }
        }
        throw error;
      }
      console.log('Profile fetched successfully:', data?.role);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile catch block:', error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('Sign out process started...');
    setIsSigningOut(true);

    try {
      // Use a timeout for the remote sign-out call
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 5000))
      ]);
      console.log('Supabase sign out successful');
    } catch (error) {
      console.error('Error or timeout during sign out:', error);
    } finally {
      // Always clear local state and redirect, even if remote sign-out failed/timed out
      setUser(null);
      setProfile(null);
      resetSupabase();
      
      // Clear storage manually to be safe
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }

      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
