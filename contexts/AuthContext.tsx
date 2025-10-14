import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '~/constants/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { fetcher } from '../lib/fetcher';
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import AsyncStorage from '@react-native-async-storage/async-storage';
interface AuthContextType {
  user: User | null;
  userId: string | null;
  loading: boolean;
  sessionLoaded: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ error?: AuthError | null }>;
  signOut: () => Promise<void>;
  handleGoogleLogin: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: AuthError | null }>;
  sendPasswordResetOTP: (email: string) => Promise<{ error?: AuthError | null }>;
  verifyOTPAndResetPassword: (email: string, token: string, newPassword: string) => Promise<{ error?: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error?: AuthError | null }>;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  // Helper function to fetch and store userId
  const fetchAndStoreUserId = useCallback(async (email: string) => {
    try {
      const response = await fetcher("getUserByEmail", { email }, { skipAuth: true });
      //  LOG  ~ 🚀: UserId response: {"data": {"avatarUrl": "https://api.dicebear.com/9.x/glass/svg?seed=alit83219", "createdAt": "2025-08-24T14:52:35.982Z", "email": "alit83219@gmail.com", "id": "cmept4xe60004b7x8s0j7cg1b", "supabaseUserId": "60bfe23b-59bd-4c7f-bff9-3371fbd52c87", "updatedAt": "2025-08-24T14:52:35.982Z"}, "error": null, "success": true}
      console.log(`~ 🚀: UserId response:`, response)
      if (response.success && response.data?.id) {
        const fetchedUserId = response.data.id;
        console.log('~ 🚀: UserId fetched:', fetchedUserId);
        setUserId(fetchedUserId);
        // Store in AsyncStorage for offline access
        await AsyncStorage.setItem('offline_user_id', fetchedUserId);
        const async_storage_userId = await AsyncStorage.getItem('offline_user_id');
        console.log('~ 🚀: AsyncStorage UserId:', async_storage_userId);
        console.log('~ 🚀: UserId fetched and stored:', fetchedUserId);
        return fetchedUserId;
      } else {
        console.warn('Failed to fetch userId from backend:', response.error);
        return null;
      }
    } catch (error) {
      console.error('Error fetching userId:', error);
      return null;
    }
  }, []);

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
          // Fetch and store userId for this session
          if (initialSession.user.email) {
            await fetchAndStoreUserId(initialSession.user.email);
          }
        } else {
          console.log('~ 🚀: No initial session found.');
          // Try offline hydration of user if any
          try {
            const cachedUserRaw = await AsyncStorage.getItem('offline_last_user');
            const cachedUserId = await AsyncStorage.getItem('offline_user_id');
            if (cachedUserRaw) {
              const cachedUser: User = JSON.parse(cachedUserRaw);
              setUser(cachedUser);
              console.log('~ 🚀: Hydrated user from offline cache.');
            }
            if (cachedUserId) {
              setUserId(cachedUserId);
              console.log('~ 🚀: Hydrated userId from offline cache.');
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
          const cachedUserId = await AsyncStorage.getItem('offline_user_id');
          if (cachedUserRaw) {
            const cachedUser: User = JSON.parse(cachedUserRaw);
            setUser(cachedUser);
            console.log('~ 🚀: Hydrated user from offline cache after error.');
          }
          if (cachedUserId) {
            setUserId(cachedUserId);
            console.log('~ 🚀: Hydrated userId from offline cache after error.');
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
          // Fetch and store userId for this session
          if (session.user.email) {
            await fetchAndStoreUserId(session.user.email);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserId(null);
          try { 
            await AsyncStorage.removeItem('offline_last_user');
            await AsyncStorage.removeItem('offline_user_id');
          } catch {}
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);


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
      
        // Fetch and store userId for this session
        if (data.user.email) {
          await fetchAndStoreUserId(data.user.email);
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
        setSession(session);
        setUser(user);
        // Fetch and store userId for this session
        if (user.email) {
          await fetchAndStoreUserId(user.email);
        }
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
      setUserId(null);
      try { 
        await AsyncStorage.removeItem('offline_last_user');
        await AsyncStorage.removeItem('offline_user_id');
      } catch {}
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
        redirectTo: 'com.quickstash.app://reset-password',
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

  const sendPasswordResetOTP = async (email: string) => {
    console.log('~ 🚀: Sending password reset OTP to:', email);
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.quickstash.app://reset-password',
      });

      console.log('~ 🚀: Send OTP response:', { success: !error });

      if (error) {
        console.log('~ 🚀: Send OTP failed:', error.message);
        setLoading(false);
        return { error };
      }

      console.log('~ 🚀: Password reset OTP sent successfully.');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('~ 🚀: Send OTP error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const verifyOTPAndResetPassword = async (email: string, token: string, newPassword: string) => {
    console.log('~ 🚀: Verifying OTP and resetting password for:', email);
    setLoading(true);
    
    try {
      // First verify the OTP by attempting to sign in with the token
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'recovery'
      });

      if (verifyError) {
        console.log('~ 🚀: OTP verification failed:', verifyError.message);
        setLoading(false);
        return { error: verifyError };
      }

      // If OTP is verified, we should have a session, now update the password
      if (verifyData.session) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (updateError) {
          console.log('~ 🚀: Password update failed:', updateError.message);
          setLoading(false);
          return { error: updateError };
        }

        console.log('~ 🚀: Password reset successfully.');
        setLoading(false);
        return { error: null };
      } else {
        console.log('~ 🚀: No session after OTP verification');
        setLoading(false);
        return { error: { message: 'No session after OTP verification' } as AuthError };
      }
    } catch (error) {
      console.error('~ 🚀: Verify OTP and reset password error:', error);
      setLoading(false);
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    console.log('~ 🚀: Updating password');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.log('~ 🚀: Password update failed:', error.message);
        setLoading(false);
        return { error };
      }

      console.log('~ 🚀: Password updated successfully.');
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('~ 🚀: Password update error:', error);
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
        // Fetch and store userId for this session
        if (data.session.user.email) {
          await fetchAndStoreUserId(data.session.user.email);
        }
      } else if (data?.user) {
        setUser(data.user);
        // Fetch and store userId for this session
        if (data.user.email) {
          await fetchAndStoreUserId(data.user.email);
        }
      }
    } catch (e) {
      console.error("Google Sign-In error:", e);
    }
  };
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      userId,
      loading, 
      sessionLoaded, 
      signIn, 
      // @ts-ignore
      signUp,
      handleGoogleLogin,
      signOut, 
      resetPassword,
      sendPasswordResetOTP,
      verifyOTPAndResetPassword,
      updatePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};
