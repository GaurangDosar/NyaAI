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
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }

      return data?.role as 'user' | 'lawyer' | null;
    } catch (error) {
      console.error('Exception in fetchUserRole:', error);
      return null;
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception in fetchProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Safety timeout - if auth doesn't load in 5 seconds, stop loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('AuthContext - Timeout: Force stopping loading after 5s');
        setLoading(false);
      }
    }, 5000);

    // Check for existing session on mount IMMEDIATELY
    const initializeAuth = async () => {
      try {
        console.log('AuthContext - Starting initialization...');
        console.log('AuthContext - Supabase connection check');
        const startTime = Date.now();
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext - getSession took:', Date.now() - startTime, 'ms');
        
        if (!mounted) return;

        if (error) {
          console.error('AuthContext - Error getting session:', error);
          clearTimeout(timeoutId);
          setLoading(false);
          return;
        }

        console.log('AuthContext - Session check:', session?.user?.email || 'No user');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch role and profile in parallel for faster loading
          const [role, profileData] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchProfile(session.user.id)
          ]);
          
          if (!mounted) return;
          
          console.log('AuthContext - Loaded - role:', role, 'profile:', profileData?.name);
          setUserRole(role);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('AuthContext - Initialization error:', error);
      } finally {
        if (mounted) {
          console.log('AuthContext - Initialization complete, loading: false');
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    // Start initialization immediately
    initializeAuth();

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('AuthContext - Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch in parallel
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