// ========================================
// FILE: services/boardingHouseService.ts
// Student Boarding House Management
// ========================================
import DatabaseService from './database';

export interface BoardingHouseMetadata {
  id?: number;
  property_id: number;
  total_rooms: number;
  total_bedspaces: number;
  available_bedspaces: number;
  gender_policy: 'male_only' | 'female_only' | 'mixed' | 'separated_floors';
  rules_and_policies?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  check_in_time?: string;
  check_out_time?: string;
  academic_year_start?: string;
  academic_year_end?: string;
}

export interface BoardingRoom {
  id?: number;
  property_id: number;
  room_number: string;
  room_name?: string;
  floor_number?: number;
  bedspace_count: number;
  price_per_bedspace: number;
  gender?: 'male' | 'female' | 'mixed';
  amenities?: string[];
  images?: string[];
  status: 'active' | 'inactive' | 'maintenance';
  occupied_count?: number;
  available_count?: number;
}

export interface Bedspace {
  id?: number;
  room_id: number;
  bedspace_number: string;
  occupancy_status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  tenant_id?: number;
  tenant_name?: string;
  booking_start_date?: string;
  booking_end_date?: string;
  payment_status?: 'pending' | 'paid' | 'overdue';
  notes?: string;
}

export interface BoardingHouseOverview {
  property: any;
  metadata: BoardingHouseMetadata;
  rooms: BoardingRoom[];
  occupancy_rate: number;
  total_revenue: number;
  monthly_revenue: number;
}

class BoardingHouseService {
  // ========================================
  // BOARDING HOUSE MANAGEMENT
  // ========================================
  
  async createBoardingHouse(
    landlordId: number,
    propertyData: any,
    metadata: BoardingHouseMetadata
  ): Promise<number> {
    const db = DatabaseService.getDatabase();

    // Create the property first
    const propertyResult = await db.runAsync(`
      INSERT INTO properties (
        owner_id, property_type, title, description, address, city,
        price_per_month, status, amenities, images, latitude, longitude
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      landlordId,
      'student_boarding',
      propertyData.title,
      propertyData.description || '',
      propertyData.address,
      propertyData.city,
      0, // Will be calculated from bedspaces
      'available',
      propertyData.amenities ? JSON.stringify(propertyData.amenities) : '[]',
      propertyData.images ? JSON.stringify(propertyData.images) : '[]',
      propertyData.latitude || null,
      propertyData.longitude || null,
    ]);

    const propertyId = propertyResult.lastInsertRowId;

    // Create boarding house metadata
    await db.runAsync(`
      INSERT INTO boarding_house_metadata (
        property_id, total_rooms, total_bedspaces, available_bedspaces,
        gender_policy, rules_and_policies, guardian_name, guardian_phone,
        guardian_email, check_in_time, check_out_time,
        academic_year_start, academic_year_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      propertyId,
      metadata.total_rooms,
      metadata.total_bedspaces,
      metadata.total_bedspaces,
      metadata.gender_policy,
      metadata.rules_and_policies || '',
      metadata.guardian_name || '',
      metadata.guardian_phone || '',
      metadata.guardian_email || '',
      metadata.check_in_time || '14:00',
      metadata.check_out_time || '10:00',
      metadata.academic_year_start || null,
      metadata.academic_year_end || null,
    ]);

    return propertyId;
  }

  async getBoardingHouseOverview(propertyId: number, landlordId: number): Promise<BoardingHouseOverview> {
    const db = DatabaseService.getDatabase();

    // Get property details
    const property = await db.getFirstAsync(`
      SELECT * FROM properties WHERE id = ? AND owner_id = ?
    `, [propertyId, landlordId]);

    if (!property) {
      throw new Error('Boarding house not found');
    }

    // Get metadata
    const metadata = await db.getFirstAsync<BoardingHouseMetadata>(`
      SELECT * FROM boarding_house_metadata WHERE property_id = ?
    `, [propertyId]);

    // Get rooms with occupancy
    const rooms = await db.getAllAsync<any>(`
      SELECT 
        r.*,
        COUNT(b.id) as total_beds,
        COUNT(CASE WHEN b.occupancy_status = 'occupied' THEN 1 END) as occupied_count,
        COUNT(CASE WHEN b.occupancy_status = 'available' THEN 1 END) as available_count
      FROM boarding_rooms r
      LEFT JOIN bedspaces b ON r.id = b.room_id
      WHERE r.property_id = ?
      GROUP BY r.id
      ORDER BY r.room_number
    `, [propertyId]);

    // Calculate revenue
    const revenue = await db.getFirstAsync<any>(`
      SELECT 
        SUM(amount) as total,
        SUM(CASE 
          WHEN strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now') 
          THEN amount ELSE 0 
        END) as monthly
      FROM payments 
      WHERE property_id = ? AND status = 'completed'
    `, [propertyId]);

    const totalBedspaces = metadata?.total_bedspaces || 0;
    const availableBedspaces = metadata?.available_bedspaces || 0;
    const occupancyRate = totalBedspaces > 0 
      ? ((totalBedspaces - availableBedspaces) / totalBedspaces) * 100 
      : 0;

    return {
      property,
      metadata: metadata!,
      rooms: rooms.map(r => ({
        ...r,
        amenities: r.amenities ? JSON.parse(r.amenities) : [],
        images: r.images ? JSON.parse(r.images) : [],
      })),
      occupancy_rate: occupancyRate,
      total_revenue: revenue?.total || 0,
      monthly_revenue: revenue?.monthly || 0,
    };
  }

  // ========================================
  // ROOM MANAGEMENT
  // ========================================

  async addRoom(landlordId: number, roomData: BoardingRoom): Promise<number> {
    const db = DatabaseService.getDatabase();

    // Verify property ownership
    const property = await db.getFirstAsync(`
      SELECT id FROM properties 
      WHERE id = ? AND owner_id = ? AND property_type = 'student_boarding'
    `, [roomData.property_id, landlordId]);

    if (!property) {
      throw new Error('Property not found or unauthorized');
    }

    // Insert room
    const result = await db.runAsync(`
      INSERT INTO boarding_rooms (
        property_id, room_number, room_name, floor_number,
        bedspace_count, price_per_bedspace, gender,
        amenities, images, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      roomData.property_id,
      roomData.room_number,
      roomData.room_name || '',
      roomData.floor_number || null,
      roomData.bedspace_count,
      roomData.price_per_bedspace,
      roomData.gender || 'mixed',
      roomData.amenities ? JSON.stringify(roomData.amenities) : '[]',
      roomData.images ? JSON.stringify(roomData.images) : '[]',
      roomData.status || 'active',
    ]);

    const roomId = result.lastInsertRowId;

    // Auto-create bedspaces
    for (let i = 1; i <= roomData.bedspace_count; i++) {
      await db.runAsync(`
        INSERT INTO bedspaces (room_id, bedspace_number, occupancy_status)
        VALUES (?, ?, ?)
      `, [roomId, `BED-${i}`, 'available']);
    }

    // Update metadata totals
    await this.updateBoardingHouseMetadata(roomData.property_id);

    return roomId;
  }

  async getRoomDetails(roomId: number, landlordId: number): Promise<any> {
    const db = DatabaseService.getDatabase();

    const room = await db.getFirstAsync<any>(`
      SELECT r.*, p.owner_id
      FROM boarding_rooms r
      JOIN properties p ON r.property_id = p.id
      WHERE r.id = ? AND p.owner_id = ?
    `, [roomId, landlordId]);

    if (!room) {
      throw new Error('Room not found or unauthorized');
    }

    const bedspaces = await db.getAllAsync<Bedspace>(`
      SELECT 
        b.*,
        u.full_name as tenant_name
      FROM bedspaces b
      LEFT JOIN users u ON b.tenant_id = u.id
      WHERE b.room_id = ?
      ORDER BY b.bedspace_number
    `, [roomId]);

    return {
      ...room,
      amenities: room.amenities ? JSON.parse(room.amenities) : [],
      images: room.images ? JSON.parse(room.images) : [],
      bedspaces,
    };
  }

  async updateRoom(roomId: number, landlordId: number, roomData: Partial<BoardingRoom>): Promise<void> {
    const db = DatabaseService.getDatabase();

    await db.runAsync(`
      UPDATE boarding_rooms 
      SET 
        room_number = COALESCE(?, room_number),
        room_name = COALESCE(?, room_name),
        floor_number = COALESCE(?, floor_number),
        price_per_bedspace = COALESCE(?, price_per_bedspace),
        gender = COALESCE(?, gender),
        amenities = COALESCE(?, amenities),
        images = COALESCE(?, images),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? 
      AND property_id IN (SELECT id FROM properties WHERE owner_id = ?)
    `, [
      roomData.room_number || null,
      roomData.room_name || null,
      roomData.floor_number || null,
      roomData.price_per_bedspace || null,
      roomData.gender || null,
      roomData.amenities ? JSON.stringify(roomData.amenities) : null,
      roomData.images ? JSON.stringify(roomData.images) : null,
      roomData.status || null,
      roomId,
      landlordId,
    ]);
  }

  // ========================================
  // BEDSPACE MANAGEMENT
  // ========================================

  async bookBedspace(
    bedspaceId: number,
    tenantId: number,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const db = DatabaseService.getDatabase();

    // Check if bedspace is available
    const bedspace = await db.getFirstAsync<any>(`
      SELECT * FROM bedspaces WHERE id = ? AND occupancy_status = 'available'
    `, [bedspaceId]);

    if (!bedspace) {
      throw new Error('Bedspace not available');
    }

    // Book the bedspace
    await db.runAsync(`
      UPDATE bedspaces 
      SET 
        occupancy_status = 'occupied',
        tenant_id = ?,
        booking_start_date = ?,
        booking_end_date = ?,
        payment_status = 'pending',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [tenantId, startDate, endDate, bedspaceId]);

    // Get room and property info for metadata update
    const room = await db.getFirstAsync<any>(`
      SELECT r.property_id FROM boarding_rooms r
      JOIN bedspaces b ON r.id = b.room_id
      WHERE b.id = ?
    `, [bedspaceId]);

    // Update available bedspaces count
    await this.updateBoardingHouseMetadata(room.property_id);
  }

  async releaseBedspace(bedspaceId: number, landlordId: number): Promise<void> {
    const db = DatabaseService.getDatabase();

    // Get property_id for verification and metadata update
    const bedspace = await db.getFirstAsync<any>(`
      SELECT r.property_id 
      FROM bedspaces b
      JOIN boarding_rooms r ON b.room_id = r.id
      JOIN properties p ON r.property_id = p.id
      WHERE b.id = ? AND p.owner_id = ?
    `, [bedspaceId, landlordId]);

    if (!bedspace) {
      throw new Error('Bedspace not found or unauthorized');
    }

    await db.runAsync(`
      UPDATE bedspaces 
      SET 
        occupancy_status = 'available',
        tenant_id = NULL,
        booking_start_date = NULL,
        booking_end_date = NULL,
        payment_status = 'pending',
        notes = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [bedspaceId]);

    await this.updateBoardingHouseMetadata(bedspace.property_id);
  }

  async updateBedspaceStatus(
    bedspaceId: number,
    landlordId: number,
    status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  ): Promise<void> {
    const db = DatabaseService.getDatabase();

    await db.runAsync(`
      UPDATE bedspaces 
      SET 
        occupancy_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? 
      AND room_id IN (
        SELECT r.id FROM boarding_rooms r
        JOIN properties p ON r.property_id = p.id
        WHERE p.owner_id = ?
      )
    `, [status, bedspaceId, landlordId]);
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private async updateBoardingHouseMetadata(propertyId: number): Promise<void> {
    const db = DatabaseService.getDatabase();

    const stats = await db.getFirstAsync<any>(`
      SELECT 
        COUNT(DISTINCT r.id) as total_rooms,
        COUNT(b.id) as total_bedspaces,
        COUNT(CASE WHEN b.occupancy_status = 'available' THEN 1 END) as available_bedspaces
      FROM boarding_rooms r
      LEFT JOIN bedspaces b ON r.id = b.room_id
      WHERE r.property_id = ?
    `, [propertyId]);

    await db.runAsync(`
      UPDATE boarding_house_metadata 
      SET 
        total_rooms = ?,
        total_bedspaces = ?,
        available_bedspaces = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE property_id = ?
    `, [
      stats?.total_rooms || 0,
      stats?.total_bedspaces || 0,
      stats?.available_bedspaces || 0,
      propertyId,
    ]);
  }

  async getAvailableBedspaces(propertyId: number): Promise<Bedspace[]> {
    const db = DatabaseService.getDatabase();

    return await db.getAllAsync<Bedspace>(`
      SELECT 
        b.*,
        r.room_number,
        r.room_name,
        r.price_per_bedspace
      FROM bedspaces b
      JOIN boarding_rooms r ON b.room_id = r.id
      WHERE r.property_id = ? 
      AND b.occupancy_status = 'available'
      ORDER BY r.room_number, b.bedspace_number
    `, [propertyId]);
  }

  // ========================================
  // TENANT METHODS - Browse and Search
  // ========================================

  async getAllBoardingHouses(filters?: {
    city?: string;
    gender_policy?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<any[]> {
    const db = DatabaseService.getDatabase();

    let query = `
      SELECT 
        p.*,
        m.total_rooms,
        m.total_bedspaces,
        m.available_bedspaces,
        m.gender_policy,
        m.guardian_name,
        m.guardian_phone,
        MIN(r.price_per_bedspace) as min_price,
        MAX(r.price_per_bedspace) as max_price
      FROM properties p
      JOIN boarding_house_metadata m ON p.id = m.property_id
      LEFT JOIN boarding_rooms r ON p.id = r.property_id
      WHERE p.property_type = 'student_boarding' 
      AND p.status = 'available'
    `;

    const params: any[] = [];

    if (filters?.city) {
      query += ' AND LOWER(p.city) = LOWER(?)';
      params.push(filters.city);
    }

    if (filters?.gender_policy && filters.gender_policy !== 'all') {
      query += ' AND m.gender_policy = ?';
      params.push(filters.gender_policy);
    }

    query += ' GROUP BY p.id ORDER BY p.created_at DESC';

    const houses = await db.getAllAsync<any>(query, params);

    return houses.map((house: any) => ({
      ...house,
      images: house.images ? JSON.parse(house.images) : [],
      amenities: house.amenities ? JSON.parse(house.amenities) : [],
    }));
  }
}

export default new BoardingHouseService();