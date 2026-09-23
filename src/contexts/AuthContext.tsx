import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { restoreSession } from '../utils/sessionStartup';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  sessionError: string | null;
  retrySession: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    setLoading(true);
    setSessionError(null);
    const handleAuthRedirect = async (url: string | null) => {
      // The web client already consumes the browser callback URL.
      if (Platform.OS === 'web' || !url || !url.includes('#')) {
        return;
      }

      const fragment = url.split('#')[1];
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        if (active)
          setSessionError(
            'That sign-in link could not be opened. Try again or request a new link.',
          );
      }
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      authEventReceived = true;
      setSession(session);
      setUser(session?.user ?? null);
      setSessionError(null);
      setLoading(false);
    });

    restoreSession(() => supabase.auth.getSession())
      .then((session) => {
        if (!active || authEventReceived) return;
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        if (active && !authEventReceived) {
          setSessionError(
            'We could not restore your session. Check your connection and try again.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (sessionAttempt === 0) {
      Linking.getInitialURL()
        .then(handleAuthRedirect)
        .catch(() => {
          if (active)
            setSessionError(
              'We could not open the sign-in link. Please try again.',
            );
        });
    }

    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      handleAuthRedirect(url).catch(() => {
        if (active)
          setSessionError(
            'We could not open the sign-in link. Please try again.',
          );
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
      urlSubscription.remove();
    };
  }, [sessionAttempt]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return Boolean(data.session);
  };

  const signInWithMagicLink = async (email: string) => {
    const redirectTo = Linking.createURL('auth/callback');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: Linking.createURL('auth/callback'),
      },
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: Linking.createURL('auth/callback'),
      },
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        sessionError,
        retrySession: () => setSessionAttempt((attempt) => attempt + 1),
        signIn,
        signUp,
        signInWithMagicLink,
        signOut,
        signInWithGoogle,
        signInWithApple,
      }}
    >
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
