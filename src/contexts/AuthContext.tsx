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
  const [initialized, setInitialized] = useState(false);
  
  // Session cache to prevent repeated validations (5 second TTL)
  const sessionCacheRef = React.useRef<{ session: Session | null; timestamp: number } | null>(null);
  const isRefreshingRef = React.useRef(false);
  const initializingRef = React.useRef(false);
  const processingEventRef = React.useRef(false);
  const lastEventRef = React.useRef<{ event: string; timestamp: number } | null>(null);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

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
        .maybeSingle();

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
    let hasInitialized = false; // Local variable, not state

    // Check for existing session on mount
    const initializeAuth = async () => {
      // Prevent multiple simultaneous initializations
      if (initializingRef.current || hasInitialized) {
        console.log('AuthContext - Already initializing or initialized, skipping');
        return;
      }
      
      initializingRef.current = true;
      hasInitialized = true;
      
      try {
        console.log('AuthContext - Starting initialization...');
        console.log('AuthContext - localStorage available:', typeof localStorage !== 'undefined');
        
        // Check for Supabase auth keys in localStorage
        const supabaseKeys = Object.keys(localStorage).filter(key => key.includes('supabase'));
        console.log('AuthContext - Supabase auth keys in localStorage:', supabaseKeys);
        
        const startTime = Date.now();
        
        // Get session directly without forcing refresh (much faster)
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthContext - getSession took:', Date.now() - startTime, 'ms');
        console.log('AuthContext - Session exists:', !!session, 'Error:', error);
        
        if (!mounted) {
          initializingRef.current = false;
          return;
        }

        if (error) {
          console.error('AuthContext - Error getting session:', error);
          
          // Check if it's a corrupted session error
          const isCorruptedSession = error.message?.includes('session_not_found') || 
                                     error.message?.includes('invalid') ||
                                     error.message?.includes('malformed') ||
                                     error.message?.includes('expired');
          
          if (isCorruptedSession) {
            console.log('AuthContext - Corrupted/invalid session detected, clearing auth data');
            
            // Clear all Supabase-related localStorage items
            const keysToRemove = Object.keys(localStorage).filter(key => 
              key.includes('supabase') || key.includes('sb-')
            );
            keysToRemove.forEach(key => {
              console.log('AuthContext - Removing localStorage key:', key);
              localStorage.removeItem(key);
            });
            
            // Sign out to clear server-side session
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('AuthContext - Error during signOut:', signOutError);
            }
          } else {
            console.log('AuthContext - Temporary error (network/timeout), not clearing session');
          }
          
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        // If session exists, use it directly (auto-refresh handles token refresh in background)
        if (session) {
          console.log('AuthContext - Session found:', session.user?.email);
          
          // Cache the session
          sessionCacheRef.current = { session, timestamp: Date.now() };
          
          setSession(session);
          setUser(session.user);
          
          // Fetch role and profile in parallel for faster loading
          const [role, profileData] = await Promise.all([
            fetchUserRole(session.user.id),
            fetchProfile(session.user.id)
          ]);
          
          if (!mounted) {
            initializingRef.current = false;
            return;
          }
          
          console.log('AuthContext - Loaded - role:', role, 'profile:', profileData?.name);
          
          // Only update if values actually changed
          setUserRole(role);
          setProfile(profileData);
        } else {
          console.log('AuthContext - No session found');
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('AuthContext - Initialization error:', error);
        // Clear everything on error
        setSession(null);
        setUser(null);
        setUserRole(null);
        setProfile(null);
      } finally {
        if (mounted) {
          console.log('AuthContext - Initialization complete, loading: false');
          setLoading(false);
          setInitialized(true);
        }
        initializingRef.current = false;
      }
    };

    // Start initialization immediately (only once using ref, not state)
    initializeAuth();

    // Set up auth state listener for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        // Prevent processing same event multiple times rapidly
        if (processingEventRef.current) {
          console.log('AuthContext - Already processing an event, skipping:', event);
          return;
        }
        
        // Check if this is a duplicate event within 2 seconds
        const lastEvent = lastEventRef.current;
        if (lastEvent && lastEvent.event === event && (Date.now() - lastEvent.timestamp) < 2000) {
          console.log('AuthContext - Duplicate event within 2s, skipping:', event);
          return;
        }
        
        // Don't process events during initialization
        if (initializingRef.current) {
          console.log('AuthContext - Skipping event during initialization:', event);
          return;
        }
        
        // Mark that we're processing
        processingEventRef.current = true;
        lastEventRef.current = { event, timestamp: Date.now() };
        
        console.log('AuthContext - Auth state changed:', event, 'Session user:', session?.user?.email);
        
        // Handle INITIAL_SESSION event (fired right after client is constructed)
        if (event === 'INITIAL_SESSION') {
          console.log('AuthContext - Initial session loaded, skipping (already handled in init)');
          // Session is already handled in initializeAuth, skip to avoid duplicate processing
          processingEventRef.current = false;
          return;
        }
        
        // Handle TOKEN_REFRESHED event (background token refresh)
        if (event === 'TOKEN_REFRESHED') {
          console.log('AuthContext - Token refreshed in background');
          if (session) {
            sessionCacheRef.current = { session, timestamp: Date.now() };
            setSession(session);
            setUser(session.user);
          }
          processingEventRef.current = false;
          return;
        }
        
        // Handle SIGNED_OUT event
        if (event === 'SIGNED_OUT') {
          console.log('AuthContext - User signed out');
          sessionCacheRef.current = null;
          setSession(null);
          setUser(null);
          setUserRole(null);
          setProfile(null);
          processingEventRef.current = false;
          return;
        }
        
        // Handle USER_UPDATED event, just update the session, don't refetch everything
        if (event === 'USER_UPDATED') {
          console.log('AuthContext - User updated');
          if (session) {
            sessionCacheRef.current = { session, timestamp: Date.now() };
            setSession(session);
            setUser(session.user);
          }
          processingEventRef.current = false;
          return;
        }
        
        // Handle SIGNED_IN event (avoid redundant fetches if data hasn't changed)
        if (event === 'SIGNED_IN') {
          console.log('AuthContext - User signed in event');
          
          // Check if this is actually a new user session
          const cache = sessionCacheRef.current;
          const isSameUser = cache?.session?.user?.id === session?.user?.id;
          const isRecent = cache && (Date.now() - cache.timestamp) < 10000; // 10 second cache
          
          if (isSameUser && isRecent) {
            console.log('AuthContext - Skipping SIGNED_IN (same user, recent cache)');
            processingEventRef.current = false;
            return;
          }
          
          // Also check if current state already matches
          if (user?.id === session?.user?.id && userRole !== null) {
            console.log('AuthContext - Skipping SIGNED_IN (user already loaded with role)');
            processingEventRef.current = false;
            return;
          }
          
          // Update session cache for new sign in
          if (session) {
            sessionCacheRef.current = { session, timestamp: Date.now() };
          }
          
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            console.log('AuthContext - Fetching role and profile for new sign in');
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
          processingEventRef.current = false;
          return;
        }
        
        // For any other events, just log them and don't process
        console.log('AuthContext - Unhandled event:', event, '- ignoring');
        processingEventRef.current = false;
      }
    );

    return () => {
      mounted = false;
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
      // Clear any potentially corrupted session data before signing in
      console.log('SignIn - Clearing any existing session data');
      const existingKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || key.includes('sb-')
      );
      if (existingKeys.length > 0) {
        console.log('SignIn - Found existing Supabase keys, clearing:', existingKeys);
        existingKeys.forEach(key => localStorage.removeItem(key));
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('SignIn - Error:', error);
        // If sign in fails, make sure we clear everything
        if (error.message?.includes('Invalid') || error.message?.includes('session')) {
          console.log('SignIn - Clearing localStorage due to auth error');
          Object.keys(localStorage).filter(key => 
            key.includes('supabase') || key.includes('sb-')
          ).forEach(key => localStorage.removeItem(key));
        }
      }
      
      return { error };
    } catch (error: any) {
      console.error('SignIn - Exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('SignOut - Clearing all auth data');
    
    // Clear localStorage first
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    keysToRemove.forEach(key => {
      console.log('SignOut - Removing key:', key);
      localStorage.removeItem(key);
    });
    
    // Clear session cache
    sessionCacheRef.current = null;
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('SignOut - Error during signOut:', error);
    }
    
    // Clear state
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