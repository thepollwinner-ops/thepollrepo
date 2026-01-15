import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  upi_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  sessionToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
    
    // Handle deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    if (!url) return;
    
    // Extract session_id from URL (support both hash and query params)
    const sessionIdMatch = url.match(/[#?]session_id=([^&]+)/);
    if (sessionIdMatch) {
      const sessionId = sessionIdMatch[1];
      await exchangeSessionId(sessionId);
    }
  };

  const checkExistingSession = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      console.log('No existing session');
    } finally {
      setLoading(false);
    }
  };

  const exchangeSessionId = async (sessionId: string) => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BACKEND_URL}/api/auth/google/session`,
        {},
        {
          headers: { 'X-Session-ID': sessionId },
          withCredentials: true,
        }
      );
      setUser(response.data);
    } catch (error) {
      console.error('Session exchange failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, name?: string, isLogin: boolean = true) => {
    try {
      setLoading(true);
      
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email, password }
        : { email, password, name };
      
      const response = await axios.post(`${BACKEND_URL}${endpoint}`, payload, {
        withCredentials: true,
      });
      
      setUser(response.data);
    } catch (error: any) {
      console.error('Auth error:', error);
      throw new Error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      setSessionToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, sessionToken }}>
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