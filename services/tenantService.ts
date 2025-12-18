// ========================================
// FILE: services/tenantService.ts
// Tenant-specific database operations (FIXED: Lazy DB Access)
// ========================================
import DatabaseService from './database';

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
  deposit_amount: number | null;
  status: 'available' | 'occupied' | 'maintenance' | 'inactive';
  amenities: string[];
  images: string[];
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  owner_name?: string;
}

export interface TenantApplication {
  id: number;
  property_id: number;
  property_title: string;
  property_type: string;
  status: 'pending' | 'approved' | 'rejected';
  application_fee: number;
  documents: string[];
  notes: string | null;
  created_at: string;
}

export interface Payment {
  id: number;
  property_id: number;
  property_title: string;
  payment_type: 'rent' | 'deposit' | 'penalty' | 'application_fee';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string | null;
  transaction_ref: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface MaintenanceRequest {
  id: number;
  property_id: number;
  property_title: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: number;
  property_id: number;
  tenant_id: number;
  property_title: string;
  property_address: string;
  landlord_name: string;
  tenant_name: string;
  rent_amount: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: 'pending' | 'signed' | 'active' | 'expired';
  signed_date: string | null;
  signature_data: string | null;
  terms: string[];
  created_at: string;
}

class TenantService {
  // CRITICAL FIX: Use getter instead of property to avoid early initialization
  private get db() {
    return DatabaseService.getDatabase();
  }

  // ========================================
  // PROPERTY BROWSING
  // ========================================
  async getAvailableProperties(
    type?: 'residential' | 'student_boarding' | 'commercial',
    city?: string
  ): Promise<Property[]> {
    let query = `
      SELECT 
        p.*,
        u.full_name as owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.status = 'available'
    `;
    const params: any[] = [];

    if (type) {
      query += ' AND p.property_type = ?';
      params.push(type);
    }

    if (city) {
      query += ' AND p.city LIKE ?';
      params.push(`%${city}%`);
    }

    query += ' ORDER BY p.created_at DESC';

    const properties = await this.db.getAllAsync<any>(query, params);

    return properties.map(p => ({
      ...p,
      amenities: p.amenities ? JSON.parse(p.amenities) : [],
      images: p.images ? JSON.parse(p.images) : [],
    }));
  }

  async getPropertyDetails(propertyId: number): Promise<Property | null> {
    const property = await this.db.getFirstAsync<any>(`
      SELECT 
        p.*,
        u.full_name as owner_name
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `, [propertyId]);

    if (!property) return null;

    return {
      ...property,
      amenities: property.amenities ? JSON.parse(property.amenities) : [],
      images: property.images ? JSON.parse(property.images) : [],
    };
  }

  // ========================================
  // APPLICATIONS
  // ========================================
  async submitApplication(
    tenantId: number,
    propertyId: number,
    documents: string[] = []
  ): Promise<number> {
    const result = await this.db.runAsync(`
      INSERT INTO applications (property_id, tenant_id, documents, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, [propertyId, tenantId, JSON.stringify(documents)]);

    return result.lastInsertRowId;
  }

  async getMyApplications(tenantId: number): Promise<TenantApplication[]> {
    const apps = await this.db.getAllAsync<any>(`
      SELECT 
        a.*,
        p.title as property_title,
        p.property_type
      FROM applications a
      JOIN properties p ON a.property_id = p.id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC
    `, [tenantId]);

    return apps.map(a => ({
      ...a,
      documents: a.documents ? JSON.parse(a.documents) : [],
    }));
  }

  // ========================================
  // PAYMENTS
  // ========================================
  async getPaymentHistory(tenantId: number): Promise<Payment[]> {
    const payments = await this.db.getAllAsync<any>(`
      SELECT 
        py.*,
        p.title as property_title
      FROM payments py
      JOIN properties p ON py.property_id = p.id
      WHERE py.tenant_id = ?
      ORDER BY py.created_at DESC
    `, [tenantId]);

    return payments;
  }

  async recordPayment(
    tenantId: number,
    propertyId: number,
    amount: number,
    paymentType: 'rent' | 'deposit' | 'penalty' | 'application_fee',
    transactionRef: string,
    paymentMethod: string
  ): Promise<void> {
    await this.db.runAsync(`
      INSERT INTO payments (
        tenant_id, property_id, payment_type, amount, status,
        payment_method, transaction_ref, paid_at, created_at
      ) VALUES (?, ?, ?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))
    `, [tenantId, propertyId, paymentType, amount, paymentMethod, transactionRef]);
  }

  // ========================================
  // MAINTENANCE REQUESTS
  // ========================================
  async submitMaintenanceRequest(
    tenantId: number,
    propertyId: number,
    title: string,
    description: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    images: string[] = []
  ): Promise<number> {
    const result = await this.db.runAsync(`
      INSERT INTO maintenance_requests (
        property_id, tenant_id, title, description, priority, images, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [propertyId, tenantId, title, description, priority, JSON.stringify(images)]);

    return result.lastInsertRowId;
  }

  async getMyMaintenanceRequests(tenantId: number): Promise<MaintenanceRequest[]> {
    const requests = await this.db.getAllAsync<any>(`
      SELECT 
        m.*,
        p.title as property_title
      FROM maintenance_requests m
      JOIN properties p ON m.property_id = p.id
      WHERE m.tenant_id = ?
      ORDER BY m.created_at DESC
    `, [tenantId]);

    return requests.map(r => ({
      ...r,
      images: r.images ? JSON.parse(r.images) : [],
    }));
  }

  // ========================================
  // DIGITAL AGREEMENTS
  // ========================================
  async getMyAgreements(tenantId: number): Promise<Agreement[]> {
    const agreements = await this.db.getAllAsync<any>(`
      SELECT 
        a.*,
        p.title as property_title,
        p.address as property_address,
        p.price_per_month as rent_amount,
        p.deposit_amount,
        u.full_name as landlord_name,
        t.full_name as tenant_name
      FROM agreements a
      JOIN properties p ON a.property_id = p.id
      JOIN users u ON p.owner_id = u.id
      JOIN users t ON a.tenant_id = t.id
      WHERE a.tenant_id = ?
      ORDER BY a.created_at DESC
    `, [tenantId]);

    return agreements.map(a => ({
      ...a,
      terms: a.terms ? JSON.parse(a.terms) : [],
    }));
  }

  async signAgreement(
    agreementId: number,
    signatureData: string
  ): Promise<void> {
    await this.db.runAsync(`
      UPDATE agreements
      SET status = 'signed',
          signed_date = datetime('now'),
          signature_data = ?
      WHERE id = ?
    `, [signatureData, agreementId]);
  }

  async createAgreement(
    tenantId: number,
    propertyId: number,
    startDate: string,
    endDate: string,
    terms: string[]
  ): Promise<number> {
    const result = await this.db.runAsync(`
      INSERT INTO agreements (
        property_id, tenant_id, start_date, end_date, terms, 
        status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `, [propertyId, tenantId, startDate, endDate, JSON.stringify(terms)]);

    return result.lastInsertRowId;
  }

  // ========================================
  // DASHBOARD STATS
  // ========================================
  async getActiveRentalCount(tenantId: number): Promise<number> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT COUNT(DISTINCT property_id) as count
      FROM payments
      WHERE tenant_id = ? AND status = 'completed'
    `, [tenantId]);

    return result?.count || 0;
  }

  async getPendingApplicationsCount(tenantId: number): Promise<number> {
    const result = await this.db.getFirstAsync<any>(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE tenant_id = ? AND status = 'pending'
    `, [tenantId]);

    return result?.count || 0;
  }
}

export default new TenantService();