// ========================================
// FILE: services/landlordService.ts
// Landlord-specific database operations
// ========================================
import DatabaseService from './database';

export interface LandlordStats {
  totalProperties: number;
  occupiedProperties: number;
  availableProperties: number;
  totalRevenue: number;
  monthlyRevenue: number;
  pendingApplications: number;
  activeTenants: number;
  maintenanceRequests: number;
}

export interface PropertyWithRevenue {
  id: number;
  title: string;
  address: string;
  city: string;
  property_type: string;
  status: string;
  price_per_month: number;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  images: string;
  created_at: string;
  // Revenue breakdown (VISIBLE TO LANDLORDS)
  total_collected: number;
  platform_commission: number;
  maintenance_fund: number;
  application_fees: number;
  net_to_owner: number;
  tenant_count: number;
}

export interface TenantInfo {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  property_id: number;
  property_title: string;
  move_in_date: string;
  rent_amount: number;
  last_payment_date: string;
  payment_status: 'current' | 'overdue' | 'pending';
}

export interface ApplicationDetail {
  id: number;
  tenant_id: number;
  tenant_name: string;
  tenant_email: string;
  tenant_phone: string;
  property_id: number;
  property_title: string;
  status: 'pending' | 'approved' | 'rejected';
  application_fee: number;
  documents: string;
  notes: string;
  created_at: string;
}

export interface FinancialBreakdown {
  period: string;
  total_rent_collected: number;
  platform_commission_amount: number;
  platform_commission_percent: number;
  maintenance_fund_amount: number;
  maintenance_fund_percent: number;
  application_fees_amount: number;
  application_fees_percent: number;
  net_to_owner_amount: number;
  net_to_owner_percent: number;
  transaction_count: number;
}

export interface MaintenanceRequest {
  id: number;
  property_id: number;
  property_title: string;
  tenant_id: number;
  tenant_name: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  images: string;
  created_at: string;
  updated_at: string;
}

class LandlordService {
  // ========================================
  // DASHBOARD STATS
  // ========================================
  async getDashboardStats(landlordId: number): Promise<LandlordStats> {
    const db = DatabaseService.getDatabase();

    const [properties, revenue, applications, tenants, maintenance] = await Promise.all([
      db.getFirstAsync(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied,
          COUNT(CASE WHEN status = 'available' THEN 1 END) as available
        FROM properties 
        WHERE owner_id = ?
      `, [landlordId]),
      
      db.getFirstAsync(`
        SELECT 
          SUM(amount) as total,
          SUM(CASE 
            WHEN strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now') 
            THEN amount ELSE 0 
          END) as monthly
        FROM payments 
        WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)
        AND status = 'completed'
      `, [landlordId]),
      
      db.getFirstAsync(`
        SELECT COUNT(*) as count 
        FROM applications 
        WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)
        AND status = 'pending'
      `, [landlordId]),
      
      db.getFirstAsync(`
        SELECT COUNT(DISTINCT tenant_id) as count
        FROM payments
        WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)
        AND status = 'completed'
      `, [landlordId]),
      
      db.getFirstAsync(`
        SELECT COUNT(*) as count
        FROM maintenance_requests
        WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)
        AND status IN ('open', 'in_progress')
      `, [landlordId])
    ]);

    return {
      totalProperties: (properties as any)?.total || 0,
      occupiedProperties: (properties as any)?.occupied || 0,
      availableProperties: (properties as any)?.available || 0,
      totalRevenue: (revenue as any)?.total || 0,
      monthlyRevenue: (revenue as any)?.monthly || 0,
      pendingApplications: (applications as any)?.count || 0,
      activeTenants: (tenants as any)?.count || 0,
      maintenanceRequests: (maintenance as any)?.count || 0,
    };
  }

  // ========================================
  // PROPERTY MANAGEMENT
  // ========================================
  async getPropertiesWithRevenue(landlordId: number): Promise<PropertyWithRevenue[]> {
    const db = DatabaseService.getDatabase();

    // Get system settings for fee calculation
    const platformCommission = 25; // From settings
    const maintenanceFund = 15;
    const applicationFee = 10;

    const properties = await db.getAllAsync<any>(`
      SELECT 
        p.*,
        COALESCE(SUM(CASE WHEN py.status = 'completed' THEN py.amount ELSE 0 END), 0) as total_collected,
        COUNT(DISTINCT py.tenant_id) as tenant_count
      FROM properties p
      LEFT JOIN payments py ON p.id = py.property_id
      WHERE p.owner_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [landlordId]);

    return properties.map((p: any) => ({
      ...p,
      platform_commission: (p.total_collected * platformCommission) / 100,
      maintenance_fund: (p.total_collected * maintenanceFund) / 100,
      application_fees: (p.total_collected * applicationFee) / 100,
      net_to_owner: p.total_collected - 
        ((p.total_collected * platformCommission) / 100) -
        ((p.total_collected * maintenanceFund) / 100) -
        ((p.total_collected * applicationFee) / 100),
    }));
  }

  async addProperty(landlordId: number, propertyData: any): Promise<number> {
    const db = DatabaseService.getDatabase();

    const result = await db.runAsync(`
      INSERT INTO properties (
        owner_id, property_type, title, description, address, city,
        bedrooms, bathrooms, max_occupancy, price_per_month, deposit_amount,
        status, amenities, images, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      landlordId,
      propertyData.property_type,
      propertyData.title,
      propertyData.description || '',
      propertyData.address,
      propertyData.city,
      propertyData.bedrooms || 0,
      propertyData.bathrooms || 0,
      propertyData.max_occupancy || 0,
      propertyData.price_per_month,
      propertyData.deposit_amount || 0,
      'available',
      propertyData.amenities ? JSON.stringify(propertyData.amenities) : '[]',
      propertyData.images ? JSON.stringify(propertyData.images) : '[]',
      propertyData.latitude || null,
      propertyData.longitude || null,
    ]);

    return result.lastInsertRowId;
  }

  async updateProperty(propertyId: number, landlordId: number, propertyData: any): Promise<void> {
    const db = DatabaseService.getDatabase();

    await db.runAsync(`
      UPDATE properties 
      SET 
        property_type = ?,
        title = ?,
        description = ?,
        address = ?,
        city = ?,
        bedrooms = ?,
        bathrooms = ?,
        max_occupancy = ?,
        price_per_month = ?,
        deposit_amount = ?,
        amenities = ?,
        images = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND owner_id = ?
    `, [
      propertyData.property_type,
      propertyData.title,
      propertyData.description,
      propertyData.address,
      propertyData.city,
      propertyData.bedrooms,
      propertyData.bathrooms,
      propertyData.max_occupancy,
      propertyData.price_per_month,
      propertyData.deposit_amount,
      propertyData.amenities ? JSON.stringify(propertyData.amenities) : '[]',
      propertyData.images ? JSON.stringify(propertyData.images) : '[]',
      propertyId,
      landlordId,
    ]);
  }

  async updatePropertyStatus(propertyId: number, landlordId: number, status: string): Promise<void> {
    const db = DatabaseService.getDatabase();

    await db.runAsync(`
      UPDATE properties 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND owner_id = ?
    `, [status, propertyId, landlordId]);
  }

  async deleteProperty(propertyId: number, landlordId: number): Promise<void> {
    const db = DatabaseService.getDatabase();

    await db.runAsync(
      'DELETE FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, landlordId]
    );
  }

  // ========================================
  // TENANT MANAGEMENT
  // ========================================
  async getTenants(landlordId: number): Promise<TenantInfo[]> {
    const db = DatabaseService.getDatabase();

    const tenants = await db.getAllAsync<any>(`
      SELECT DISTINCT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        p.id as property_id,
        p.title as property_title,
        MIN(py.paid_at) as move_in_date,
        p.price_per_month as rent_amount,
        MAX(py.paid_at) as last_payment_date,
        CASE 
          WHEN MAX(py.paid_at) >= date('now', '-30 days') THEN 'current'
          WHEN MAX(py.paid_at) < date('now', '-30 days') THEN 'overdue'
          ELSE 'pending'
        END as payment_status
      FROM users u
      INNER JOIN payments py ON u.id = py.tenant_id
      INNER JOIN properties p ON py.property_id = p.id
      WHERE p.owner_id = ? AND py.status = 'completed'
      GROUP BY u.id, p.id
      ORDER BY u.full_name
    `, [landlordId]);

    return tenants || [];
  }

  // ========================================
  // APPLICATION MANAGEMENT
  // ========================================
  async getApplications(landlordId: number, status?: string): Promise<ApplicationDetail[]> {
    const db = DatabaseService.getDatabase();

    let query = `
      SELECT 
        a.*,
        u.full_name as tenant_name,
        u.email as tenant_email,
        u.phone_number as tenant_phone,
        p.title as property_title
      FROM applications a
      JOIN users u ON a.tenant_id = u.id
      JOIN properties p ON a.property_id = p.id
      WHERE p.owner_id = ?
    `;

    const params: any[] = [landlordId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    query += ' ORDER BY a.created_at DESC';

    const applications = await db.getAllAsync<ApplicationDetail>(query, params);
    return applications || [];
  }

  async updateApplicationStatus(
    applicationId: number,
    landlordId: number,
    status: 'approved' | 'rejected',
    notes?: string
  ): Promise<void> {
    const db = DatabaseService.getDatabase();

    // Verify the application belongs to landlord's property
    const application = await db.getFirstAsync<any>(`
      SELECT a.*, p.owner_id
      FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.id = ? AND p.owner_id = ?
    `, [applicationId, landlordId]);

    if (!application) {
      throw new Error('Application not found or unauthorized');
    }

    await db.runAsync(`
      UPDATE applications 
      SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [status, notes || '', applicationId]);

    // If approved, update property status to occupied
    if (status === 'approved') {
      await db.runAsync(`
        UPDATE properties 
        SET status = 'occupied', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [application.property_id]);
    }
  }

  // ========================================
  // FINANCIAL REPORTS (WITH FEE BREAKDOWN)
  // ========================================
  async getFinancialBreakdown(landlordId: number, period: 'month' | 'year'): Promise<FinancialBreakdown> {
    const db = DatabaseService.getDatabase();

    // System fee percentages
    const platformCommission = 25;
    const maintenanceFund = 15;
    const applicationFeePercent = 10;

    let dateFilter = '';
    if (period === 'month') {
      dateFilter = "AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')";
    } else {
      dateFilter = "AND strftime('%Y', paid_at) = strftime('%Y', 'now')";
    }

    const result = await db.getFirstAsync<any>(`
      SELECT 
        SUM(amount) as total_rent,
        COUNT(*) as transaction_count
      FROM payments
      WHERE property_id IN (SELECT id FROM properties WHERE owner_id = ?)
      AND status = 'completed'
      ${dateFilter}
    `, [landlordId]);

    const totalRent = result?.total_rent || 0;

    return {
      period: period === 'month' ? 'This Month' : 'This Year',
      total_rent_collected: totalRent,
      platform_commission_amount: (totalRent * platformCommission) / 100,
      platform_commission_percent: platformCommission,
      maintenance_fund_amount: (totalRent * maintenanceFund) / 100,
      maintenance_fund_percent: maintenanceFund,
      application_fees_amount: (totalRent * applicationFeePercent) / 100,
      application_fees_percent: applicationFeePercent,
      net_to_owner_amount: totalRent - 
        ((totalRent * platformCommission) / 100) -
        ((totalRent * maintenanceFund) / 100) -
        ((totalRent * applicationFeePercent) / 100),
      net_to_owner_percent: 100 - platformCommission - maintenanceFund - applicationFeePercent,
      transaction_count: result?.transaction_count || 0,
    };
  }

  async downloadFinancialStatement(landlordId: number, startDate: string, endDate: string): Promise<any> {
    const db = DatabaseService.getDatabase();

    const payments = await db.getAllAsync(`
      SELECT 
        py.*,
        p.title as property_title,
        u.full_name as tenant_name
      FROM payments py
      JOIN properties p ON py.property_id = p.id
      JOIN users u ON py.tenant_id = u.id
      WHERE p.owner_id = ?
      AND py.status = 'completed'
      AND py.paid_at BETWEEN ? AND ?
      ORDER BY py.paid_at DESC
    `, [landlordId, startDate, endDate]);

    return payments;
  }

  // ========================================
  // MAINTENANCE MANAGEMENT
  // ========================================
  async getMaintenanceRequests(landlordId: number): Promise<MaintenanceRequest[]> {
    const db = DatabaseService.getDatabase();

    const requests = await db.getAllAsync<MaintenanceRequest>(`
      SELECT 
        m.*,
        p.title as property_title,
        u.full_name as tenant_name
      FROM maintenance_requests m
      JOIN properties p ON m.property_id = p.id
      JOIN users u ON m.tenant_id = u.id
      WHERE p.owner_id = ?
      ORDER BY 
        CASE m.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        m.created_at DESC
    `, [landlordId]);

    return requests || [];
  }

  async updateMaintenanceStatus(
    requestId: number,
    landlordId: number,
    status: string
  ): Promise<void> {
    const db = DatabaseService.getDatabase();

    // Verify the request belongs to landlord's property
    await db.runAsync(`
      UPDATE maintenance_requests 
      SET status = ?, updated_at = CURRENT_TIMESTAMP,
          resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = ? 
      AND property_id IN (SELECT id FROM properties WHERE owner_id = ?)
    `, [status, status, requestId, landlordId]);
  }
}

export default new LandlordService();