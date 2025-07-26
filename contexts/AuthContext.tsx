import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { fetcher } from '~/lib/fetcher';

interface AuthContextType {
  user: any;
  loading: boolean;
  sessionLoaded: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  getValidAccessToken: () => Promise<string | null>;
  accessToken: string | null;
}

const SESSION_KEY = 'user_session';

type SessionType = {
  user: any;
  token: string;
  refreshToken: string;
  expiresAt: number; // unix timestamp in ms
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      console.log('~ 🚀: Loading session from SecureStore...');
      setLoading(true);
      const sessionStr = await SecureStore.getItemAsync(SESSION_KEY);
      if (sessionStr) {
        const sessionObj: SessionType = JSON.parse(sessionStr);
        console.log('~ 🚀: Session found:', sessionObj);
        setSession(sessionObj);
        setUser(sessionObj.user);
      } else {
        console.log('~ 🚀: No session found.');
      }
      setSessionLoaded(true);
      setLoading(false);
    };
    loadSession();
  }, []);

  const saveSession = async (sessionObj: SessionType) => {
    console.log('~ 🚀: Saving session:', sessionObj);
    setSession(sessionObj);
    setUser(sessionObj.user);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(sessionObj));
  };

  const clearSession = async () => {
    console.log('~ 🚀: Clearing session...');
    setSession(null);
    setUser(null);
    await SecureStore.deleteItemAsync(SESSION_KEY);
  };

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    console.log('~ 🚀: Refreshing access token...');
    const data = await fetcher("refreshToken", { refresh_token: refreshToken });
    console.log('~ 🚀: Token refresh response:', data);
    const token = data.token || data.access_token;
    const refresh = data.refreshToken || data.refresh_token || refreshToken;
    const expiresIn = data.expiresIn || data.expires_in;

    if (data.success && token && expiresIn) {
      const newSession: SessionType = {
        user: data.user,
        token,
        refreshToken: refresh,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      await saveSession(newSession);
      console.log('~ 🚀: Token refreshed and session updated.');
      return newSession.token;
    } else {
      console.log('~ 🚀: Token refresh failed. Clearing session...');
      await clearSession();
      return null;
    }
  }, []);

  const getValidAccessToken = useCallback(async () => {
    console.log('~ 🚀: Getting valid access token...');
    if (!session) {
      console.log('~ 🚀: No session available.');
      return null;
    }
    if (Date.now() < session.expiresAt - 60 * 1000) {
      console.log('~ 🚀: Access token still valid.');
      return session.token;
    }
    console.log('~ 🚀: Token expired. Refreshing...');
    return await refreshAccessToken(session.refreshToken);
  }, [session, refreshAccessToken]);

  const signIn = async (email: string, password: string) => {
    console.log('~ 🚀: Signing in with:', email);
    setLoading(true);
    const { data, success } = await fetcher("login", { email, password });
    console.log('~ 🚀: Sign-in response:', data);

    const token = data.access_token;
    const refresh = data.refresh_token;
    const expiresIn = data.expires_in;

    if (success && token && refresh && expiresIn) {
      const sessionObj: SessionType = {
        user: data.user,
        token,
        refreshToken: refresh,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      await saveSession(sessionObj);
      console.log('~ 🚀: Sign-in successful. Session saved.');
    } else {
      console.log('~ 🚀: Sign-in failed. Clearing session...');
      await clearSession();
    }
    setLoading(false);
    return data;
  };

  const signUp = async (email: string, password: string) => {
    console.log('~ 🚀: Signing up with:', email);
    setLoading(true);
    const data = await fetcher("register", { email, password });
    console.log('~ 🚀: Sign-up response:', data);

    const token = data.access_token;
    const refresh = data.refresh_token;
    const expiresIn = data.expires_in;

    if (data.success && token && refresh && expiresIn) {
      const sessionObj: SessionType = {
        user: data.user,
        token,
        refreshToken: refresh,
        expiresAt: Date.now() + expiresIn * 1000,
      };
      await saveSession(sessionObj);
      console.log('~ 🚀: Sign-up successful. Session saved.');
    } else {
      console.log('~ 🚀: Sign-up failed. Clearing session...');
      await clearSession();
    }
    setLoading(false);
    return data;
  };

  const signOut = async () => {
    console.log('~ 🚀: Signing out...');
    setLoading(true);
    await clearSession();
    setLoading(false);
    console.log('~ 🚀: Signed out.');
  };

  const resetPassword = async (email: string) => {
    console.log('~ 🚀: Requesting password reset for:', email);
    setLoading(true);
    const data = await fetcher("resetPassword", { email });
    console.log('~ 🚀: Reset password response:', data);
    setLoading(false);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionLoaded, signIn, signUp, signOut, resetPassword, getValidAccessToken, accessToken: session ? session.token : null }}>
      {children}
    </AuthContext.Provider>
  );
};
