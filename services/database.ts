// ========================================
// FILE: services/database.ts
// SQLite Database Setup and Management (Android Crash Fixed)
// ========================================
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'stayin.db';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      // CRITICAL FIX FOR ANDROID: Forces a fresh native connection
      // This resolves the NullPointerException in prepareAsync/runAsync
      this.db = await SQLite.openDatabaseAsync(DB_NAME, {
        useNewConnection: true
      });

      await this.createTables();
      await this.seedDefaultData();
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    // Users table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone_number TEXT,
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

    // Sessions table for auth
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

    console.log('✅ All tables created successfully');
  }

  private async seedDefaultData() {
    if (!this.db) throw new Error('Database not initialized');

    // Check if admin exists
    const adminExists = await this.db.getFirstAsync(
      'SELECT id FROM users WHERE email = ?',
      ['admin@stayin.com']
    );

    if (!adminExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status, kyc_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'admin@stayin.com',
          'admin123',
          'System Administrator',
          '+260971234567',
          'admin',
          'active',
          1
        ]
      );
      console.log('✅ Default admin user created');
    }

    const tenantExists = await this.db.getFirstAsync(
      'SELECT id FROM users WHERE email = ?',
      ['tenant@test.com']
    );

    if (!tenantExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'tenant@test.com',
          'tenant123',
          'Test Tenant',
          '+260977654321',
          'tenant',
          'active'
        ]
      );
      console.log('✅ Test tenant user created');
    }

    const landlordExists = await this.db.getFirstAsync(
      'SELECT id FROM users WHERE email = ?',
      ['landlord@test.com']
    );

    if (!landlordExists) {
      await this.db.runAsync(
        `INSERT INTO users (email, password, full_name, phone_number, role, status, kyc_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          'landlord@test.com',
          'landlord123',
          'Test Landlord',
          '+260978765432',
          'landlord',
          'active',
          1
        ]
      );
      console.log('✅ Test landlord user created');
    }
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
      DROP TABLE IF EXISTS maintenance_requests;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS applications;
      DROP TABLE IF EXISTS properties;
      DROP TABLE IF EXISTS users;
    `);
    
    console.log('⚠️ Database reset completed');
    await this.createTables();
    await this.seedDefaultData();
  }
}

export default new DatabaseService();