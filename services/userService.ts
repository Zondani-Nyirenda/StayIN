// ========================================
// FILE: services/userService.ts
// Fixed User Profile Management Service
// ========================================
import DatabaseService from './database';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: 'tenant' | 'landlord' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  profile_image: string | null;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  full_name?: string;
  email?: string;
  phone_number?: string;
  profile_image?: string;
}

class UserService {
  private get db() {
    return DatabaseService.getDatabase();
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: number): Promise<UserProfile | null> {
    try {
      const user = await this.db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        role: user.role,
        status: user.status,
        profile_image: user.profile_image,
        kyc_verified: user.kyc_verified === 1,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw new Error('Failed to get user profile');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: number, data: UpdateProfileData): Promise<void> {
    try {
      console.log('📝 Updating profile for user:', userId, data);

      const updates: string[] = [];
      const values: any[] = [];

      if (data.full_name !== undefined) {
        updates.push('full_name = ?');
        values.push(data.full_name);
      }

      if (data.email !== undefined) {
        // Check if email is already taken by another user
        const existingUser = await this.db.getFirstAsync<any>(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [data.email.toLowerCase(), userId]
        );

        if (existingUser) {
          throw new Error('Email is already in use by another account');
        }

        updates.push('email = ?');
        values.push(data.email.toLowerCase());
      }

      if (data.phone_number !== undefined) {
        updates.push('phone_number = ?');
        values.push(data.phone_number);
      }

      if (data.profile_image !== undefined) {
        updates.push('profile_image = ?');
        values.push(data.profile_image);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

      const result = await this.db.runAsync(query, values);
      
      console.log('✅ Profile updated successfully. Rows affected:', result.changes);

      // Verify the update
      const updatedUser = await this.db.getFirstAsync<any>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      console.log('✅ Verified updated user data:', {
        id: updatedUser?.id,
        full_name: updatedUser?.full_name,
        email: updatedUser?.email,
        phone_number: updatedUser?.phone_number,
        profile_image: updatedUser?.profile_image
      });

    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      console.log('🔒 Changing password for user:', userId);

      // Verify current password
      const user = await this.db.getFirstAsync<any>(
        'SELECT password FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Direct password comparison (no hashing since we store plain text)
      if (user.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const result = await this.db.runAsync(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newPassword, userId]
      );

      console.log('✅ Password changed successfully. Rows affected:', result.changes);

    } catch (error: any) {
      console.error('❌ Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Upload profile image
   */
  async uploadProfileImage(userId: number, imageUri: string): Promise<string> {
    try {
      console.log('📸 Uploading profile image for user:', userId);

      await this.db.runAsync(
        'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [imageUri, userId]
      );

      console.log('✅ Profile image uploaded successfully');
      return imageUri;
    } catch (error) {
      console.error('❌ Failed to upload profile image:', error);
      throw new Error('Failed to upload profile image');
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(userId: number): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE users SET profile_image = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [userId]
      );
      console.log('✅ Profile image deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete profile image:', error);
      throw new Error('Failed to delete profile image');
    }
  }

  /**
   * Get user statistics (for profile display)
   */
  async getUserStats(userId: number, role: 'tenant' | 'landlord'): Promise<any> {
    try {
      if (role === 'tenant') {
        const [applications, payments, maintenanceRequests] = await Promise.all([
          this.db.getFirstAsync<any>(
            'SELECT COUNT(*) as count FROM applications WHERE tenant_id = ?',
            [userId]
          ),
          this.db.getFirstAsync<any>(
            'SELECT COUNT(*) as count FROM payments WHERE tenant_id = ? AND status = "completed"',
            [userId]
          ),
          this.db.getFirstAsync<any>(
            'SELECT COUNT(*) as count FROM maintenance_requests WHERE tenant_id = ?',
            [userId]
          ),
        ]);

        return {
          totalApplications: applications?.count || 0,
          totalPayments: payments?.count || 0,
          totalMaintenanceRequests: maintenanceRequests?.count || 0,
        };
      } else if (role === 'landlord') {
        const [properties, tenants, revenue] = await Promise.all([
          this.db.getFirstAsync<any>(
            'SELECT COUNT(*) as count FROM properties WHERE owner_id = ?',
            [userId]
          ),
          this.db.getFirstAsync<any>(
            'SELECT COUNT(DISTINCT tenant_id) as count FROM payments WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)',
            [userId]
          ),
          this.db.getFirstAsync<any>(
            'SELECT SUM(amount) as total FROM payments WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?) AND status = "completed"',
            [userId]
          ),
        ]);

        return {
          totalProperties: properties?.count || 0,
          totalTenants: tenants?.count || 0,
          totalRevenue: revenue?.total || 0,
        };
      }

      return {};
    } catch (error) {
      console.error('❌ Failed to get user stats:', error);
      throw new Error('Failed to get user stats');
    }
  }
}

export default new UserService();