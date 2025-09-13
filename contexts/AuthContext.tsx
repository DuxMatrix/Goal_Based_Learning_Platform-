"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, api, AuthManager } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: { name: string; email: string; password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Check for existing auth on mount
    const checkAuth = async () => {
      const token = AuthManager.getToken();
      const storedUser = AuthManager.getUser();

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await api.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data.user);
          } else {
            // Token is invalid, clear storage
            AuthManager.removeToken();
            setUser(null);
          }
        } catch (error) {
          // Token is invalid, clear storage
          AuthManager.removeToken();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login({ email, password });
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: { name: string; email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await api.register(userData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthManager.removeToken();
    setUser(null);
    // Optionally call logout endpoint
    api.logout().catch(() => {
      // Ignore errors on logout
    });
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      // Update user data optimistically
      if (user) {
        setUser({ ...user, ...userData });
      }
      
      // Make API call to update user
      // This would typically be a separate API endpoint for updating user profile
      // For now, we'll just update the local state
    } catch (error) {
      // Revert optimistic update on error
      if (user) {
        setUser(user);
      }
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
