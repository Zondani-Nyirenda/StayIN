// ========================================
// FILE: contexts/AuthContext.tsx
// Authentication Context with SQLite
// ========================================
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'expo-router';
import authService, { UserData } from '../services/authService';
import databaseService from '../services/database';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isLandlord: boolean;
  isTenant: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  isAdmin: false,
  isLandlord: false,
  isTenant: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Initialize app: database + check current session
  useEffect(() => {
    async function initializeApp() {
      try {
        console.log('🚀 Initializing StayIN App...');
        await databaseService.init();

        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);

        // AFTER loading user, redirect to correct dashboard ONCE
        if (currentUser) {
          if (currentUser.role === 'admin') {
            router.replace('/(admin)/dashboard');
          } else if (currentUser.role === 'landlord') {
            router.replace('/(landlord)/dashboard');
          } else if (currentUser.role === 'tenant') {
            router.replace('/(tenant)/dashboard');
          }
        }

        console.log('✅ App initialized');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      } finally {
        setLoading(false);
      }
    }

    initializeApp();
  }, []); // Run only once on mount

  // Sign In
  async function signIn(email: string, password: string) {
    try {
      const result = await authService.login(email, password);

      if (result.success && result.userData) {
        setUser(result.userData);

        // Redirect based on role AFTER successful login
        if (result.userData.role === 'admin') {
          router.replace('/(admin)/dashboard');
        } else if (result.userData.role === 'landlord') {
          router.replace('/(landlord)/dashboard');
        } else if (result.userData.role === 'tenant') {
          router.replace('/(tenant)/dashboard');
        }

        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Login failed',
      };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }

  // Sign Out
  async function signOut() {
    try {
      await authService.logout();
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    isLandlord: user?.role === 'landlord',
    isTenant: user?.role === 'tenant',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;