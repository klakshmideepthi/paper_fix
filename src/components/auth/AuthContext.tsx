"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { createOrUpdateUserProfile } from '@/lib/user-management';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider?: string;
};

type AuthErrorType = {
  message: string;
};

type AuthContextType = {
  user: AuthUser | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{
    error: AuthErrorType | null;
    data: Session | null;
  }>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{
    error: AuthErrorType | null;
    data: { user: AuthUser | null; session: Session | null };
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const authUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatar: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider || 'email'
        };
        
        setUser(authUser);
        
        // Save user profile to our database
        createOrUpdateUserProfile({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatar_url: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider || 'email'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        const authUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name,
          avatar: session.user.user_metadata?.avatar_url,
          provider: session.user.app_metadata?.provider || 'email'
        };
        
        setUser(authUser);
        
        // Only create/update the user profile on specific auth events
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
          createOrUpdateUserProfile({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            avatar_url: session.user.user_metadata?.avatar_url,
            provider: session.user.app_metadata?.provider || 'email'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      
      if (response.error) {
        return {
          error: { message: response.error.message },
          data: null
        };
      }
      
      return {
        error: null,
        data: response.data.session
      };
    } catch (error) {
      return {
        error: { message: 'Failed to sign in. Please try again.' },
        data: null
      };
    }
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signUp({ email, password });
      
      if (response.error) {
        return {
          error: { message: response.error.message },
          data: { user: null, session: null }
        };
      }
      
      const authUser = response.data.user ? {
        id: response.data.user.id,
        email: response.data.user.email || '',
      } : null;
      
      return {
        error: null,
        data: {
          user: authUser,
          session: response.data.session
        }
      };
    } catch (error) {
      return {
        error: { message: 'Failed to sign up. Please try again.' },
        data: { user: null, session: null }
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    session,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}