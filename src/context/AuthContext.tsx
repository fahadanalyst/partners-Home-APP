import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, resetSupabase, initializeFormCache } from '../services/supabase';

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

  const fetchProfile = useCallback(async (userId: string) => {
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
              initializeFormCache().catch(err =>
                console.warn('AuthContext: Form cache initialization warning:', err)
              );
              return;
            }

            console.error('Failed to create profile on-the-fly:', createError);
          }
        }
        throw error;
      }

      const normalizedProfile = {
        ...data,
        role: data?.role === 'clinical_worker' ? 'care_manager' : data?.role,
      } as Profile;

      console.log('Profile fetched successfully:', normalizedProfile?.role);
      setProfile(normalizedProfile);
      initializeFormCache().catch(err =>
        console.warn('AuthContext: Form cache initialization warning:', err)
      );
    } catch (error) {
      console.error('Error in fetchProfile catch block:', error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let isMounted = true;

    const applySession = async (currentUser: User | null) => {
      if (!isMounted) return;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        return;
      }

      setProfile(null);
      setLoading(false);
    };

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

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        await applySession(session?.user ?? null);

        const { data } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state changed:', event, !!session?.user);
          void applySession(session?.user ?? null);
        });

        subscription = data.subscription;
      } catch (err) {
        console.error('Auth initialization error:', err);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signOut = async () => {
    console.log('Sign out process started...');

    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 5000))
      ]);
      console.log('Supabase sign out successful');
    } catch (error) {
      console.error('Error or timeout during sign out:', error);
    } finally {
      setUser(null);
      setProfile(null);
      resetSupabase();

      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }

      window.history.replaceState(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
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
