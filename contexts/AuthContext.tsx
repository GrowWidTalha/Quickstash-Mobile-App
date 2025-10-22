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

// Helper to add timeout to async operations
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  
  // Helper function to fetch and store userId
  const fetchAndStoreUserId = useCallback(async (email: string): Promise<string | null> => {
    try {
      const existingDBId = await AsyncStorage.getItem("offline_user_id")
      console.log("found existing userId: ", existingDBId)
      if(existingDBId){
        setUserId(existingDBId);
        return existingDBId
      }
      const response = await fetcher("getUserByEmail", { email }, { skipAuth: true });
      console.log(`~ 🚀: UserId response:`, response);
      
      if (response.success && response.data?.id) {
        const fetchedUserId = response.data.id;
        console.log('~ 🚀: UserId fetched:', fetchedUserId);
        setUserId(fetchedUserId);
        
        // Store in AsyncStorage for offline access
        await AsyncStorage.setItem('offline_user_id', fetchedUserId);
        console.log('~ 🚀: UserId stored in AsyncStorage:', fetchedUserId);
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
        // Get initial session from Supabase with timeout
        const { data: { session: initialSession } } = await withTimeout(
          supabase.auth.getSession(),
          5000
        );
        
        if (initialSession) {
          console.log('~ 🚀: Initial session found');
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Cache last known user for offline hydration
          try {
            await AsyncStorage.setItem('offline_last_user', JSON.stringify(initialSession.user));
          } catch (e) {
            console.warn('Failed to cache last user for offline use', e);
          }
          
          // Fetch and store userId for this session
          if (initialSession.user.email) {
            const fetchedUserId = await fetchAndStoreUserId(initialSession.user.email);
            if (!fetchedUserId) {
              console.warn('Failed to fetch userId, but continuing with session');
            }
          }
        } else {
          console.log('~ 🚀: No initial session found.');
          // Try offline hydration of user if any
          await hydrateFromOfflineCache();
        }
      } catch (error) {
        console.error('~ 🚀: Error loading initial session (timeout or network error):', error);
        // On error (possibly offline), try to hydrate user from cache
        await hydrateFromOfflineCache();
      } finally {
        // Always set these flags to unblock navigation
        setSessionLoaded(true);
        setLoading(false);
      }
    };

    // Helper to hydrate user from offline cache
    const hydrateFromOfflineCache = async () => {
      try {
        const cachedUserRaw = await AsyncStorage.getItem('offline_last_user');
        const cachedUserId = await AsyncStorage.getItem('offline_user_id');
        
        if (cachedUserRaw) {
          const cachedUser: User = JSON.parse(cachedUserRaw);
          setUser(cachedUser);
          console.log('~ 🚀: Hydrated user from offline cache:', cachedUser.email);
        }
        
        if (cachedUserId) {
          setUserId(cachedUserId);
          console.log('~ 🚀: Hydrated userId from offline cache:', cachedUserId);
        }
      } catch (e) {
        console.warn('Failed to hydrate user from offline cache', e);
      }
    };

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('~ 🚀: Auth state changed:', event);
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Cache user and userId
          try {
            await AsyncStorage.setItem('offline_last_user', JSON.stringify(session.user));
            
            // Fetch and store userId for this session
            if (session.user.email) {
              const fetchedUserId = await fetchAndStoreUserId(session.user.email);
              if (!fetchedUserId) {
                console.warn('Failed to fetch userId on auth state change');
              }
            }
          } catch (e) {
            console.warn('Failed to cache user data on auth change', e);
          }
        } else {
          // Clear all auth data
          setSession(null);
          setUser(null);
          setUserId(null);
          
          try { 
            await AsyncStorage.removeItem('offline_last_user');
            await AsyncStorage.removeItem('offline_user_id');
            console.log('~ 🚀: Cleared offline auth cache');
          } catch (e) {
            console.warn('Failed to clear offline auth cache', e);
          }
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAndStoreUserId]);


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

      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        
        // Cache user data
        try { 
          await AsyncStorage.setItem('offline_last_user', JSON.stringify(data.user));
        } catch (e) {
          console.warn('Failed to cache user', e);
        }
      
        // Fetch and store userId - BLOCK until complete
        if (data.user.email) {
          const fetchedUserId = await fetchAndStoreUserId(data.user.email);
          if (!fetchedUserId) {
            console.error('~ ❌: Failed to fetch userId from backend');
            setLoading(false);
            return { 
              error: { 
                message: 'Failed to fetch user data. Please try again.' 
              } as AuthError 
            };
          }
        }
      
        console.log('~ 🚀: Sign-in successful. Session and userId set.');
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
        
        // Cache user data
        try {
          await AsyncStorage.setItem('offline_last_user', JSON.stringify(user));
        } catch (e) {
          console.warn('Failed to cache user', e);
        }
        
        // Fetch and store userId - BLOCK until complete
        if (user.email) {
          const fetchedUserId = await fetchAndStoreUserId(user.email);
          if (!fetchedUserId) {
            console.error('~ ❌: Failed to fetch userId from backend during sign-up');
            setLoading(false);
            return { 
              error: { 
                message: 'Sign-up succeeded but failed to fetch user data. Please try signing in.' 
              } as AuthError 
            };
          }
        }
        
        console.log("~ ✅: Sign-up complete. Session and userId set.");
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
      setLoading(true);
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
        setLoading(false);
        throw error;
      }
  
      // Set session/user locally if present
      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Cache user data
        try {
          await AsyncStorage.setItem('offline_last_user', JSON.stringify(data.session.user));
        } catch (e) {
          console.warn('Failed to cache user', e);
        }
        
        // Fetch and store userId - BLOCK until complete
        if (data.session.user.email) {
          const fetchedUserId = await fetchAndStoreUserId(data.session.user.email);
          if (!fetchedUserId) {
            console.error('~ ❌: Failed to fetch userId from backend during Google sign-in');
            setLoading(false);
            throw new Error('Failed to fetch user data. Please try again.');
          }
        }
        
        console.log('~ ✅: Google sign-in successful. Session and userId set.');
      } else if (data?.user) {
        setUser(data.user);
        
        // Cache user data
        try {
          await AsyncStorage.setItem('offline_last_user', JSON.stringify(data.user));
        } catch (e) {
          console.warn('Failed to cache user', e);
        }
        
        // Fetch and store userId
        if (data.user.email) {
          const fetchedUserId = await fetchAndStoreUserId(data.user.email);
          if (!fetchedUserId) {
            console.error('~ ❌: Failed to fetch userId from backend during Google sign-in');
            setLoading(false);
            throw new Error('Failed to fetch user data. Please try again.');
          }
        }
        
        console.log('~ ✅: Google sign-in successful. UserId set.');
      }
      
      setLoading(false);
    } catch (e) {
      console.error("Google Sign-In error:", e);
      setLoading(false);
      throw e;
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
