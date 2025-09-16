import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '~/constants/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { fetcher } from '../lib/fetcher';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from '@react-native-async-storage/async-storage';
interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error?: AuthError | null }>;
  signOut: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: AuthError | null }>;
  getValidAccessToken: () => Promise<string | null>;
  accessToken: string | null;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "907959906564-gpo7cspo79gm4k5fp0t4fn8tmomhjdhj.apps.googleusercontent.com", // from Google Cloud (Web type)
    });
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      console.log('~ 🚀: Loading session from Supabase...');
      setLoading(true);
      
      try {
        // Get initial session from Supabase
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          console.log('~ 🚀: Initial session found:');
          setSession(initialSession);
          setUser(initialSession.user);
          // cache last known user for offline hydration
          try {
            await AsyncStorage.setItem('offline_last_user', JSON.stringify(initialSession.user));
          } catch (e) {
            console.warn('Failed to cache last user for offline use', e);
          }
        } else {
          console.log('~ 🚀: No initial session found.');
          // Try offline hydration of user if any
          try {
            const cachedUserRaw = await AsyncStorage.getItem('offline_last_user');
            if (cachedUserRaw) {
              const cachedUser: User = JSON.parse(cachedUserRaw);
              setUser(cachedUser);
              console.log('~ 🚀: Hydrated user from offline cache.');
            }
          } catch (e) {
            console.warn('Failed to hydrate user from offline cache', e);
          }
        }
      } catch (error) {
        console.error('~ 🚀: Error loading initial session:', error);
        // On error (possibly offline), try to hydrate user from cache
        try {
          const cachedUserRaw = await AsyncStorage.getItem('offline_last_user');
          if (cachedUserRaw) {
            const cachedUser: User = JSON.parse(cachedUserRaw);
            setUser(cachedUser);
            console.log('~ 🚀: Hydrated user from offline cache after error.');
          }
        } catch (e) {
          console.warn('Failed to hydrate user from offline cache after error', e);
        }
      }
      
      setSessionLoaded(true);
      setLoading(false);
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('~ 🚀: Auth state changed:');
        
        if (session) {
          setSession(session);
          setUser(session.user);
          try {
            await AsyncStorage.setItem('offline_last_user', JSON.stringify(session.user));
          } catch (e) {
            console.warn('Failed to cache last user on auth change', e);
          }
        } else {
          setSession(null);
          setUser(null);
          try { await AsyncStorage.removeItem('offline_last_user'); } catch {}
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getValidAccessToken = useCallback(async () => {
    console.log('~ 🚀: Getting valid access token...');
    
    if (!session) {
      console.log('~ 🚀: No session available.');
      return null;
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    
    if (expiresAt && now < expiresAt - 300) {
      console.log('~ 🚀: Access token still valid.');
      return session.access_token;
    }

    console.log('~ 🚀: Token expired or expiring soon. Refreshing...');
    
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('~ 🚀: Token refresh failed:', error);
        return null;
      }
      
      if (data.session) {
        console.log('~ 🚀: Token refreshed successfully.');
        return data.session.access_token;
      }
      
      return null;
    } catch (error) {
      console.error('~ 🚀: Error refreshing token:', error);
      return null;
    }
  }, [session]);

  const signIn = async (email: string, password: string) => {
    console.log('~ 🚀: Signing in with:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('~ 🚀: Sign-in response:', { success: !error, user: data.user?.email });

      if (error) {
        console.log('~ 🚀: Sign-in failed:', error.message);
        setLoading(false);
        return { error };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        try { await AsyncStorage.setItem('offline_last_user', JSON.stringify(data.user)); } catch {}
      
        // sync with our DB — call backend login that accepts supabaseUserId
        try {
          const dbResp = await fetcher("login", { supabaseUserId: data.user!.id });
          if (!dbResp.success) {
            console.warn("Failed to sync user with DB after password login:", dbResp.error);
            // handle gracefully (show toast, track telemetry, etc.)
          } else {
            console.log("DB synced (password login)", dbResp.data.user?.id);
          }
        } catch (e) {
          console.error("Error calling backend login endpoint:", e);
        }
      
        console.log('~ 🚀: Sign-in successful. Session set.');
      }
      
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('~ 🚀: Sign-in error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const signUp = async (email: string, password: string) => {
    console.log("~ 🚀: Signing up with:", email);
    setLoading(true);
  
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      console.log("~ 🚀: Sign-up response:", { success: !error, user: data.user?.email });
  
      if (error) {
        console.log("~ ❌: Sign-up failed:", error.message);
        setLoading(false);
        return { error };
      }
  
      const user = data.user;
      const session = data.session;
  
      // 🔐 Case 1: Email confirmation is disabled — session returned immediately
      if (user && session) {
        const dbUser = await fetcher("login", { supabaseUserId: user.id });
  
        if (!dbUser.success) {
          setLoading(false);
          return { error: { message: "Failed to sync user with DB" } };
        }
  
        setSession(session);
        setUser(user);
        console.log("~ ✅: Sign-up complete. Session set.");
      }
  
      // 🔐 Case 2: Email confirmation is enabled — session is null
      if (!session) {
        console.log("~ ✅: Sign-up successful. Awaiting email confirmation.");
        // You might show a screen: "Check your inbox to confirm your email"
      }
  
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error("~ 🚨: Sign-up error:", error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    console.log('~ 🚀: Signing out...');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('~ 🚀: Sign-out error:', error);
      } else {
        console.log('~ 🚀: Signed out successfully.');
      }
      
      setSession(null);
      setUser(null);
      try { await AsyncStorage.removeItem('offline_last_user'); } catch {}
      setLoading(false);
    } catch (error) {
      console.error('~ 🚀: Sign-out error:', error);
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    console.log('~ 🚀: Requesting password reset for:', email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      console.log('~ 🚀: Reset password response:', { success: !error });

      if (error) {
        console.log('~ 🚀: Reset password failed:', error.message);
        setLoading(false);
        return { error };
      }

      console.log('~ 🚀: Password reset email sent successfully.');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('~ 🚀: Reset password error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };
  const handleGoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
  
      // Use same API shape you already used
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken!, // matches your current SDK usage
      });
  
      if (error) {
        console.error("Supabase login error:", error.message);
        return;
      }
  
      // set session/user locally if present
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
      } else if (data?.user) {
        setUser(data.user);
      }
  
      // get the supabase user id (prefer session.user if present)
      const supabaseUserId = data?.session?.user?.id || data?.user?.id;
      if (!supabaseUserId) {
        console.error("No supabase user returned after Google sign-in");
        return;
      }
  
      // SYNC: call backend to ensure user row exists in DB
      try {
        const dbResp = await fetcher("login", { supabaseUserId });
        if (!dbResp.success) {
          console.error("Failed to sync Google user with DB:", dbResp.error);
          // optionally show an error toast or fallback UX
        } else {
          console.log("Google user synced with DB:", dbResp.data.user?.id);
        }
      } catch (e) {
        console.error("Error calling backend login endpoint for Google:", e);
      }
    } catch (e) {
      console.error("Google Sign-In error:", e);
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      sessionLoaded, 
      signIn, 
      // @ts-ignore
      signUp,
      handleGoogleLogin,
      signOut, 
      resetPassword, 
      getValidAccessToken, 
      accessToken: session?.access_token || null 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
