import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  userRole: 'user' | 'lawyer' | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: 'user' | 'lawyer') => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'lawyer' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (error) {
        console.warn('Could not fetch user role:', error.message);
        return 'user'; // Default to 'user' role
      }

      return (data?.role as 'user' | 'lawyer') || 'user';
    } catch (error) {
      console.warn('Exception in fetchUserRole:', error);
      return 'user'; // Default to 'user' role
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      if (error) {
        console.warn('Could not fetch profile:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Exception in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Safety timeout - if auth doesn't load in 10 seconds, stop loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timeout - forcing completion');
        setLoading(false);
      }
    }, 10000);

    // Check for existing session on mount
    const initializeAuth = async () => {
      try {
        console.log('🔐 AuthContext: Starting initialization...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔐 AuthContext: Got session:', session ? 'logged in' : 'not logged in');
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch role and profile in parallel with timeout protection
          const [role, profileData] = await Promise.race([
            Promise.all([
              fetchUserRole(session.user.id),
              fetchProfile(session.user.id)
            ]),
            new Promise<[null, null]>((resolve) => 
              setTimeout(() => resolve([null, null]), 5000)
            )
          ]);
          
          if (!mounted) return;
          
          setUserRole(role);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    // Start initialization
    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const [role, profileData] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchProfile(session.user.id)
          ]);
          
          if (!mounted) return;
          
          setUserRole(role);
          setProfile(profileData);
        } else {
          setUserRole(null);
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, role: 'user' | 'lawyer') => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRole(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    const updatedProfile = await fetchProfile(user.id);
    setProfile(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};