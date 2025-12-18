// ========================================
// FILE: services/authService.ts
// SQLite-based Authentication Service - WITH DEBUG
// ========================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import databaseService from './database';  
import * as Crypto from 'expo-crypto';

export interface UserData {
  id: number;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: 'tenant' | 'landlord' | 'admin';
  status: string;
  kycVerified: boolean;
}

interface LoginResult {
  success: boolean;
  userData?: UserData;
  error?: string;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: 'tenant' | 'landlord';
}

interface RegisterResult {
  success: boolean;
  error?: string;
}

class AuthService {
  private readonly AUTH_TOKEN_KEY = '@stayin_auth_token';
  private readonly USER_DATA_KEY = '@stayin_user_data';

  private async hashPassword(password: string): Promise<string> {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      password
    );
    return digest;
  }

  private async generateToken(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      console.log('🔐 Login attempt for:', email);
      const db = databaseService.getDatabase();

      const user = await db.getFirstAsync<any>(
        `SELECT id, email, password, full_name, phone_number, role, status, kyc_verified
         FROM users 
         WHERE email = ? AND status = 'active'`,
        [email.toLowerCase()]
      );

      if (!user) {
        console.log('❌ User not found or inactive:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      console.log('✅ User found:', {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status
      });

      // Direct password comparison (no hashing since database has plain text)
      if (user.password !== password) {
        console.log('❌ Password mismatch for:', email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      console.log('✅ Password verified for:', email);

      const token = await this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.runAsync(
        `INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)`,
        [user.id, token, expiresAt.toISOString()]
      );

      console.log('✅ Session created for user:', user.id);

      const userData: UserData = {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        phoneNumber: user.phone_number,
        role: user.role,
        status: user.status,
        kycVerified: user.kyc_verified === 1,
      };

      await AsyncStorage.setItem(this.AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));

      console.log('✅ Login successful:', userData.email, 'Role:', userData.role);

      return {
        success: true,
        userData,
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login',
      };
    }
  }

  async register(data: RegisterData): Promise<RegisterResult> {
    try {
      const db = databaseService.getDatabase();

      const existingUser = await db.getFirstAsync(
        'SELECT id FROM users WHERE email = ?',
        [data.email.toLowerCase()]
      );

      if (existingUser) {
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }

      await db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status, kyc_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.email.toLowerCase(),
          data.password,
          data.fullName,
          data.phoneNumber,
          data.role,
          'active',
          0
        ]
      );

      console.log('✅ Registration successful:', data.email);

      return { success: true };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return {
        success: false,
        error: 'An error occurred during registration',
      };
    }
  }

  async getCurrentUser(): Promise<UserData | null> {
    try {
      const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
      
      if (!token) {
        console.log('ℹ️ No auth token found');
        return null;
      }

      const db = databaseService.getDatabase();

      const session = await db.getFirstAsync<any>(
        `SELECT s.user_id, s.expires_at, 
                u.email, u.full_name, u.phone_number, u.role, u.status, u.kyc_verified
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > datetime('now')`,
        [token]
      );

      if (!session) {
        console.log('⚠️ Session expired or invalid');
        await this.logout();
        return null;
      }

      console.log('✅ Current user session valid:', session.email, session.role);

      return {
        id: session.user_id,
        email: session.email,
        fullName: session.full_name,
        phoneNumber: session.phone_number,
        role: session.role,
        status: session.status,
        kycVerified: session.kyc_verified === 1,
      };
    } catch (error) {
      console.error('❌ Get current user error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(this.AUTH_TOKEN_KEY);
      
      if (token) {
        const db = databaseService.getDatabase();
        await db.runAsync('DELETE FROM sessions WHERE token = ?', [token]);
      }

      await AsyncStorage.multiRemove([this.AUTH_TOKEN_KEY, this.USER_DATA_KEY]);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async cleanExpiredSessions(): Promise<void> {
    try {
      const db = databaseService.getDatabase();
      await db.runAsync(`DELETE FROM sessions WHERE expires_at < datetime('now')`);
      console.log('✅ Expired sessions cleaned');
    } catch (error) {
      console.error('❌ Clean sessions error:', error);
    }
  }
}

export default new AuthService();