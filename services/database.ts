// ========================================
// FILE: services/database.ts
// FULLY FIXED: Includes profile_image column
// ========================================
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'stayin.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync(DB_NAME, {
        useNewConnection: true
      });

      await this.createTables();
      await this.createStudentBoardingTables();
      await this.seedDefaultData();

      console.log('✅ Database initialized successfully (with boarding house support)');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Users table with profile_image column
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone_number TEXT,
        profile_image TEXT,
        role TEXT NOT NULL CHECK(role IN ('tenant', 'landlord', 'admin')),
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
        kyc_verified INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Properties table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        property_type TEXT NOT NULL CHECK(property_type IN ('residential', 'student_boarding', 'commercial')),
        title TEXT NOT NULL,
        description TEXT,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        bedrooms INTEGER,
        bathrooms INTEGER,
        max_occupancy INTEGER,
        price_per_month REAL NOT NULL,
        deposit_amount REAL,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance', 'inactive')),
        amenities TEXT,
        images TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );
    `);

    // Applications table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        application_fee REAL DEFAULT 0,
        documents TEXT,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (tenant_id) REFERENCES users(id)
      );
    `);

    // Payments table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        property_id INTEGER NOT NULL,
        payment_type TEXT NOT NULL CHECK(payment_type IN ('rent', 'deposit', 'penalty', 'application_fee')),
        amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'failed')),
        payment_method TEXT,
        transaction_ref TEXT,
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES users(id),
        FOREIGN KEY (property_id) REFERENCES properties(id)
      );
    `);

    // Maintenance Requests table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS maintenance_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
        images TEXT,
        assigned_to TEXT,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (tenant_id) REFERENCES users(id)
      );
    `);

    // Agreements table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS agreements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'signed', 'active', 'expired', 'terminated')),
        signed_date DATETIME,
        signature_data TEXT,
        terms TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (tenant_id) REFERENCES users(id)
      );
    `);

    // Sessions table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    console.log('✅ Core tables created successfully');
  }

  private async createStudentBoardingTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Boarding Rooms
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS boarding_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        room_number TEXT NOT NULL,
        room_name TEXT,
        floor_number INTEGER,
        bedspace_count INTEGER NOT NULL,
        price_per_bedspace REAL NOT NULL,
        gender TEXT CHECK(gender IN ('male', 'female', 'mixed')),
        amenities TEXT,
        images TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        UNIQUE(property_id, room_number)
      );
    `);

    // Bedspaces
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS bedspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER NOT NULL,
        bedspace_number TEXT NOT NULL,
        occupancy_status TEXT DEFAULT 'available' CHECK(occupancy_status IN ('available', 'occupied', 'reserved', 'maintenance')),
        tenant_id INTEGER,
        booking_start_date DATE,
        booking_end_date DATE,
        payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'overdue')),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (room_id) REFERENCES boarding_rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE(room_id, bedspace_number)
      );
    `);

    // Boarding House Metadata
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS boarding_house_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER UNIQUE NOT NULL,
        total_rooms INTEGER NOT NULL,
        total_bedspaces INTEGER NOT NULL,
        available_bedspaces INTEGER NOT NULL,
        gender_policy TEXT CHECK(gender_policy IN ('male_only', 'female_only', 'mixed', 'separated_floors')),
        rules_and_policies TEXT,
        guardian_name TEXT,
        guardian_phone TEXT,
        guardian_email TEXT,
        check_in_time TEXT,
        check_out_time TEXT,
        academic_year_start DATE,
        academic_year_end DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      );
    `);

    // Indexes for performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_boarding_rooms_property ON boarding_rooms(property_id);
      CREATE INDEX IF NOT EXISTS idx_bedspaces_room ON bedspaces(room_id);
      CREATE INDEX IF NOT EXISTS idx_bedspaces_tenant ON bedspaces(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_bedspaces_status ON bedspaces(occupancy_status);
    `);

    console.log('✅ Student boarding house tables created successfully');
  }

  private async seedDefaultData() {
    if (!this.db) throw new Error('Database not initialized');

    // Admin user
    const adminExists = await this.db.getFirstAsync('SELECT id FROM users WHERE email = ?', ['admin@stayin.com']);
    if (!adminExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status, kyc_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['admin@stayin.com', 'admin123', 'System Administrator', '+260971234567', 'admin', 'active', 1]
      );
      console.log('✅ Default admin created');
    }

    // Test tenant
    const tenantExists = await this.db.getFirstAsync('SELECT id FROM users WHERE email = ?', ['tenant@test.com']);
    if (!tenantExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['tenant@test.com', 'tenant123', 'Test Tenant', '+260977654321', 'tenant', 'active']
      );
      console.log('✅ Test tenant created');
    }

    // Test landlord
    const landlordExists = await this.db.getFirstAsync('SELECT id FROM users WHERE email = ?', ['landlord@test.com']);
    if (!landlordExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status, kyc_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['landlord@test.com', 'landlord123', 'Test Landlord', '+260978765432', 'landlord', 'active', 1]
      );
      console.log('✅ Test landlord created');
    }

    console.log('✅ Default data seeded');
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('Database not initialized. Call init() first.');
    return this.db;
  }

  async closeDatabase() {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      console.log('✅ Database closed');
    }
  }

  async resetDatabase() {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.execAsync(`
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS agreements;
      DROP TABLE IF EXISTS maintenance_requests;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS applications;
      DROP TABLE IF EXISTS bedspaces;
      DROP TABLE IF EXISTS boarding_rooms;
      DROP TABLE IF EXISTS boarding_house_metadata;
      DROP TABLE IF EXISTS properties;
      DROP TABLE IF EXISTS users;
    `);

    console.log('⚠️ Database fully reset');
    await this.createTables();
    await this.createStudentBoardingTables();
    await this.seedDefaultData();
  }
}

export default new DatabaseService();