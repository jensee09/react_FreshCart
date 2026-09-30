import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({
  path: path.join(__dirname, '../.env')
});

// ======================================================
// DATABASE CONFIGURATION
// ======================================================

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'fresh_cart';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);

let pool = null;

// ======================================================
// INITIALIZE DATABASE
// ======================================================

export async function initDb() {
  try {
    console.log('🔄 [MySQL] Initializing database...');

    // ==================================================
    // 1. CONNECT TO MYSQL SERVER
    // ==================================================

    const rootConnection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT
    });

    // Create database if it does not exist
    await rootConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`
    );

    await rootConnection.end();

    // ==================================================
    // 2. CREATE DATABASE CONNECTION POOL
    // ==================================================

    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,

      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log(
      `✅ [MySQL] Connected to database "${DB_NAME}" on ${DB_HOST}:${DB_PORT}`
    );

    // ==================================================
    // 3. USERS TABLE
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'customer',
        avatar TEXT,
        phone VARCHAR(100),
        address TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Make avatar capable of storing large image data
    await pool.query(`
      ALTER TABLE users
      MODIFY avatar LONGTEXT
    `);

    // ==================================================
    // 4. CATEGORIES TABLE
    // ==================================================
    //
    // IMPORTANT:
    // No static categories are inserted here.
    // Categories will come from the Admin/API.
    //
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        icon VARCHAR(100) DEFAULT '🌱',
        image TEXT,
        productCount INT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Make category image capable of storing large image data
    await pool.query(`
      ALTER TABLE categories
      MODIFY image LONGTEXT
    `);

    // ==================================================
    // 5. PRODUCTS TABLE
    // ==================================================
    //
    // IMPORTANT:
    // No static products are inserted here.
    // Products will come from the Admin/API.
    //
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        categoryName VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        originalPrice DECIMAL(10,2) DEFAULT 0,
        weight VARCHAR(100) DEFAULT '500g',
        stockCount INT DEFAULT 50,
        image TEXT,
        description TEXT,
        isOrganic BOOLEAN DEFAULT TRUE,
        isFeatured BOOLEAN DEFAULT TRUE,
        inStock BOOLEAN DEFAULT TRUE,
        rating DECIMAL(3,2) DEFAULT 5.0,
        reviewCount INT DEFAULT 1,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // Make product image capable of storing large image data
    await pool.query(`
      ALTER TABLE products
      MODIFY image LONGTEXT
    `);

    // ==================================================
    // 6. USER DATA TABLE
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_data (
        userId VARCHAR(255) NOT NULL,
        dataType VARCHAR(32) NOT NULL,
        payload LONGTEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        PRIMARY KEY (userId, dataType),

        CONSTRAINT fk_user_data_user
          FOREIGN KEY (userId)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ==================================================
    // 7. USER SESSIONS TABLE
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        tokenHash CHAR(64) PRIMARY KEY,
        userId VARCHAR(255) NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

        INDEX idx_user_sessions_user (userId),

        CONSTRAINT fk_user_sessions_user
          FOREIGN KEY (userId)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ==================================================
    // 8. ORDERS TABLE
    // ==================================================

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) NOT NULL,
        userId VARCHAR(255) NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'processing',
        payload LONGTEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,

        PRIMARY KEY (userId, id),

        INDEX idx_orders_user_created (userId, createdAt),
        INDEX idx_orders_created (createdAt),

        CONSTRAINT fk_orders_user
          FOREIGN KEY (userId)
          REFERENCES users(id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // ==================================================
    // 9. MIGRATE LEGACY ORDERS
    // ==================================================

    const [legacyOrders] = await pool.query(`
      SELECT userId, payload
      FROM user_data
      WHERE dataType = 'orders'
    `);

    for (const row of legacyOrders) {
      let userOrders;

      try {
        userOrders = JSON.parse(row.payload);
      } catch (error) {
        throw new Error(
          `Invalid legacy order JSON for user ${row.userId}.`
        );
      }

      if (!Array.isArray(userOrders)) {
        throw new Error(
          `Legacy order data for user ${row.userId} is not an array.`
        );
      }

      for (const order of userOrders) {
        if (!order?.id || !Array.isArray(order.items)) {
          continue;
        }

        const orderDate =
          order.date && Number.isFinite(Date.parse(order.date))
            ? new Date(order.date)
            : null;

        await pool.query(
          `
          INSERT IGNORE INTO orders
          (
            id,
            userId,
            total,
            status,
            payload,
            createdAt
          )
          VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))
          `,
          [
            String(order.id),
            row.userId,
            Number(order.total) || 0,
            order.status || 'processing',
            JSON.stringify(order),
            orderDate
          ]
        );
      }
    }

    // ==================================================
    // 10. NORMALIZE USER ROLES
    // ==================================================

    await pool.query(`
      UPDATE users
      SET role = 'admin'
      WHERE LOWER(TRIM(role)) IN ('admin', 'administrator')
    `);

    await pool.query(`
      UPDATE users
      SET role = 'user'
      WHERE LOWER(TRIM(role)) IN ('user', 'customer')
    `);

    // ==================================================
    // 11. SEED DEFAULT ADMIN/CUSTOMER USERS
    // ==================================================
    //
    // Categories and products are NOT seeded.
    //
    // ==================================================

    const [userRows] = await pool.query(`
      SELECT COUNT(*) AS count
      FROM users
    `);

    if (Number(userRows[0].count) === 0) {
      console.log(
        '🌱 [MySQL] Seeding default users into fresh_cart...'
      );

      await pool.query(`
        INSERT INTO users
        (
          id,
          name,
          email,
          password,
          role,
          avatar,
          phone,
          address
        )
        VALUES
        (
          'usr-admin',
          'Admin User',
          'admin@freshcart.com',
          'admin123',
          'admin',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
          '+1 (555) 999-8888',
          '742 Evergreen Terrace, San Francisco, CA 94107'
        ),
        (
          'usr-customer',
          'Alex Johnson',
          'user@freshcart.com',
          'user123',
          'user',
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          '+1 (555) 234-5678',
          '100 Tech Park, Suite 400, San Francisco, CA 94105'
        );
      `);
    }

    // Make sure admin user always exists
    await pool.query(
      `
      INSERT IGNORE INTO users
      (
        id,
        name,
        email,
        password,
        role,
        avatar,
        phone,
        address
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        'usr-admin-seed',
        'Admin User',
        'admin@freshcart.com',
        'admin123',
        'admin',
        null,
        '+1 (555) 999-8888',
        '742 Evergreen Terrace, San Francisco, CA 94107'
      ]
    );

    // ==================================================
    // 12. NO STATIC CATEGORIES
    // ==================================================
    //
    // Categories table remains empty until:
    //
    // Admin → Add Category → API → MySQL
    //
    // ==================================================

    console.log(
      'ℹ️ [MySQL] Categories are managed dynamically.'
    );

    // ==================================================
    // 13. NO STATIC PRODUCTS
    // ==================================================
    //
    // Products table remains empty until:
    //
    // Admin → Add Product → API → MySQL
    //
    // ==================================================

    console.log(
      'ℹ️ [MySQL] Products are managed dynamically.'
    );

    // ==================================================
    // DATABASE INITIALIZATION COMPLETE
    // ==================================================

    console.log('✅ [MySQL] Database initialization completed.');
    console.log(`📦 Database: ${DB_NAME}`);
    console.log('👤 Users: Ready');
    console.log('📂 Categories: Dynamic');
    console.log('🛒 Products: Dynamic');
    console.log('📦 Orders: Ready');

    return pool;

  } catch (err) {
    console.error(
      '❌ [MySQL Error in fresh_cart]:',
      err.message
    );

    throw err;
  }
}

// ======================================================
// GET DATABASE POOL
// ======================================================

export function getPool() {
  if (!pool) {
    throw new Error(
      'Database pool not initialized. Call initDb() first.'
    );
  }

  return pool;
}