"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '../../lib/data';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  signIn: (userData: User, token: string) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // Clear potentially corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = (userData: User, token: string) => {
    try {
      // Store token and user data
      localStorage.setItem('access_token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update context state
      setUser(userData);
      
      // Navigate to dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error during sign in:', error);
    }
  };

  const signOut = () => {
    try {
      // Clear all auth-related data
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
      localStorage.removeItem('user');
      
      // Update context state
      setUser(null);
      
      // Navigate to signin
      router.replace('/signin');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const isAuthenticated = !!user && !!localStorage.getItem('access_token');

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      loading: isLoading,
      signIn, 
      signOut, 
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}