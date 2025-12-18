// ========================================
// FILE: services/adminService.ts
// Admin-specific database operations
// ========================================
import DatabaseService from './database';

export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  totalRevenue: number;
  pendingApplications: number;
  activeMaintenanceRequests: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  role: 'tenant' | 'landlord' | 'admin';
  status: 'active' | 'inactive' | 'pending';
  kyc_verified: number;
  created_at: string;
}

export interface Property {
  id: number;
  owner_id: number;
  property_type: 'residential' | 'student_boarding' | 'commercial';
  title: string;
  description: string;
  address: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  price_per_month: number;
  deposit_amount: number;
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  amenities: string;
  images: string;
  created_at: string;
  owner_name?: string;
}

export interface SystemSettings {
  platform_commission: number; // 25%
  maintenance_fee: number; // 15%
  application_fee: number; // 10%
  penalty_rate: number;
  tax_reminder_days: number;
}

// NEW: Interface for property revenue data
export interface PropertyRevenue {
  rent_collected: number | null;
  deposits: number | null;
  penalties: number | null;
  total_payments: number | null;
}

class AdminService {
  // ========================================
  // DASHBOARD STATS
  // ========================================
  async getDashboardStats(): Promise<DashboardStats> {
    const db = DatabaseService.getDatabase();

    const [users, properties, payments, applications, maintenance] = await Promise.all([
      db.getFirstAsync('SELECT COUNT(*) as count FROM users'),
      db.getFirstAsync('SELECT COUNT(*) as count FROM properties'),
      db.getFirstAsync(`SELECT SUM(amount) as total FROM payments WHERE status = 'completed'`),
      db.getFirstAsync(`SELECT COUNT(*) as count FROM applications WHERE status = 'pending'`),
      db.getFirstAsync(`SELECT COUNT(*) as count FROM maintenance_requests WHERE status IN ('open', 'in_progress')`)
    ]);

    const monthlyRevenue = await db.getFirstAsync(`
      SELECT SUM(amount) as total FROM payments 
      WHERE status = 'completed' 
      AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
    `);

    const occupancyData = await db.getFirstAsync(`
      SELECT 
        COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
        COUNT(*) as total
      FROM properties
      WHERE status != 'inactive'
    `) as any;

    const occupancyRate = occupancyData?.total > 0 
      ? ((occupancyData.occupied / occupancyData.total) * 100) 
      : 0;

    return {
      totalUsers: (users as any)?.count || 0,
      totalProperties: (properties as any)?.count || 0,
      totalRevenue: (payments as any)?.total || 0,
      pendingApplications: (applications as any)?.count || 0,
      activeMaintenanceRequests: (maintenance as any)?.count || 0,
      monthlyRevenue: (monthlyRevenue as any)?.total || 0,
      occupancyRate: Math.round(occupancyRate)
    };
  }

  // ========================================
  // USER MANAGEMENT
  // ========================================
  async getAllUsers(): Promise<User[]> {
    const db = DatabaseService.getDatabase();
    const users = await db.getAllAsync<User>('SELECT * FROM users ORDER BY created_at DESC');
    return users || [];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const db = DatabaseService.getDatabase();
    const users = await db.getAllAsync<User>('SELECT * FROM users WHERE role = ? ORDER BY created_at DESC', [role]);
    return users || [];
  }

  async updateUserStatus(userId: number, status: 'active' | 'inactive' | 'pending'): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync(
      'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, userId]
    );
  }

  async verifyUserKYC(userId: number, verified: boolean): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync(
      'UPDATE users SET kyc_verified = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [verified ? 1 : 0, userId]
    );
  }

  async deleteUser(userId: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM users WHERE id = ?', [userId]);
  }

  // ========================================
  // PROPERTY MANAGEMENT
  // ========================================
  async getAllProperties(): Promise<Property[]> {
    const db = DatabaseService.getDatabase();
    const properties = await db.getAllAsync<Property>(`
      SELECT p.*, u.full_name as owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);
    return properties || [];
  }

  async getPropertiesByType(type: string): Promise<Property[]> {
    const db = DatabaseService.getDatabase();
    const properties = await db.getAllAsync<Property>(`
      SELECT p.*, u.full_name as owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.property_type = ?
      ORDER BY p.created_at DESC
    `, [type]);
    return properties || [];
  }

  async updatePropertyStatus(propertyId: number, status: string): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync(
      'UPDATE properties SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, propertyId]
    );
  }

  async deleteProperty(propertyId: number): Promise<void> {
    const db = DatabaseService.getDatabase();
    await db.runAsync('DELETE FROM properties WHERE id = ?', [propertyId]);
  }

  // ========================================
  // FINANCIAL REPORTS
  // ========================================
  async getRevenueReport(startDate: string, endDate: string) {
    const db = DatabaseService.getDatabase();
    
    const revenue = await db.getAllAsync(`
      SELECT 
        payment_type,
        SUM(amount) as total,
        COUNT(*) as count
      FROM payments
      WHERE status = 'completed'
      AND paid_at BETWEEN ? AND ?
      GROUP BY payment_type
    `, [startDate, endDate]);

    const totalRevenue = await db.getFirstAsync(`
      SELECT SUM(amount) as total FROM payments
      WHERE status = 'completed'
      AND paid_at BETWEEN ? AND ?
    `, [startDate, endDate]);

    return {
      breakdown: revenue || [],
      total: (totalRevenue as any)?.total || 0
    };
  }

  // FIXED: Proper typing and column names
  async getPropertyRevenue(propertyId: number): Promise<PropertyRevenue | null> {
    const db = DatabaseService.getDatabase();
    
    const revenue = await db.getFirstAsync<PropertyRevenue>(`
      SELECT 
        SUM(CASE WHEN payment_type = 'rent' THEN amount ELSE 0 END) as rent_collected,
        SUM(CASE WHEN payment_type = 'deposit' THEN amount ELSE 0 END) as deposits,
        SUM(CASE WHEN payment_type = 'penalty' THEN amount ELSE 0 END) as penalties,
        COUNT(*) as total_payments
      FROM payments
      WHERE property_id = ? AND status = 'completed'
    `, [propertyId]);

    return revenue || null;
  }

  // ========================================
  // SYSTEM SETTINGS
  // ========================================
  async getSystemSettings(): Promise<SystemSettings> {
    return {
      platform_commission: 25,
      maintenance_fee: 15,
      application_fee: 10,
      penalty_rate: 5,
      tax_reminder_days: 30
    };
  }

  async updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    console.log('Updating system settings:', settings);
  }

  // ========================================
  // APPLICATIONS MANAGEMENT
  // ========================================
  async getPendingApplications() {
    const db = DatabaseService.getDatabase();
    
    const applications = await db.getAllAsync(`
      SELECT 
        a.*,
        u.full_name as tenant_name,
        u.email as tenant_email,
        p.title as property_title,
        p.address as property_address
      FROM applications a
      JOIN users u ON a.tenant_id = u.id
      JOIN properties p ON a.property_id = p.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `);

    return applications || [];
  }

  // ========================================
  // MAINTENANCE MANAGEMENT
  // ========================================
  async getMaintenanceRequests() {
    const db = DatabaseService.getDatabase();
    
    const requests = await db.getAllAsync(`
      SELECT 
        m.*,
        u.full_name as tenant_name,
        p.title as property_title,
        p.address as property_address
      FROM maintenance_requests m
      JOIN users u ON m.tenant_id = u.id
      JOIN properties p ON m.property_id = p.id
      ORDER BY 
        CASE m.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        m.created_at DESC
    `);

    return requests || [];
  }

  // ========================================
  // ANALYTICS
  // ========================================
  async getAnalytics(period: 'week' | 'month' | 'year') {
    const db = DatabaseService.getDatabase();
    
    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "datetime('now', '-7 days')";
        break;
      case 'month':
        dateFilter = "datetime('now', '-30 days')";
        break;
      case 'year':
        dateFilter = "datetime('now', '-365 days')";
        break;
    }

    const stats = await db.getFirstAsync(`
      SELECT 
        COUNT(DISTINCT tenant_id) as active_tenants,
        SUM(amount) as revenue,
        COUNT(*) as transactions
      FROM payments
      WHERE status = 'completed'
      AND paid_at >= ${dateFilter}
    `);

    const newUsers = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM users
      WHERE created_at >= ${dateFilter}
    `);

    const newProperties = await db.getFirstAsync(`
      SELECT COUNT(*) as count FROM properties
      WHERE created_at >= ${dateFilter}
    `);

    return {
      activeTenants: (stats as any)?.active_tenants || 0,
      revenue: (stats as any)?.revenue || 0,
      transactions: (stats as any)?.transactions || 0,
      newUsers: (newUsers as any)?.count || 0,
      newProperties: (newProperties as any)?.count || 0
    };
  }
}

export default new AdminService();