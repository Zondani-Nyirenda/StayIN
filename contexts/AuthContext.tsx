// contexts/AuthContext.tsx
import React, { createContext, useContext, useState } from 'react';
import AuthService, { UserData } from '../services/authService';

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (userData: UserData) => Promise<void>;
  refreshUser: () => Promise<void>;
  loadUser: () => Promise<void>; // ← NEW: expose manually
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true); // Keep true initially

  const loadUser = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading user from auth service...');
      const currentUser = await AuthService.getCurrentUser();

      if (currentUser) {
        console.log('✅ User loaded:', currentUser.email, currentUser.role);
        setUser(currentUser);
      } else {
        console.log('ℹ️ No user session found');
        setUser(null);
      }
    } catch (error) {
      console.error('❌ Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Signing in...');
      const result = await AuthService.login(email, password);

      if (result.success && result.userData) {
        setUser(result.userData);
        return { success: true };
      }

      return { success: false, error: result.error };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  };

  const updateUser = async (userData: UserData) => {
    setUser(userData);
  };

  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const refreshedUser = await AuthService.refreshUserData(user.id);
      if (refreshedUser) {
        setUser(refreshedUser);
      }
    } catch (error) {
      console.error('❌ Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        updateUser,
        refreshUser,
        loadUser, // ← Expose it
      }}
    >
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