import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createHash, randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '8mb' }));

let pool;
let dbInitialization;

const ensureDatabase = async () => {
  if (!pool) {
    if (!dbInitialization) dbInitialization = initDb();
    try {
      pool = await dbInitialization;
    } catch (error) {
      dbInitialization = null;
      throw error;
    }
  }
  return pool;
};

app.use(async (req, res, next) => {
  try {
    await ensureDatabase();
    next();
  } catch (error) {
    console.error('MySQL is unavailable for this request:', error);
    res.status(503).json({
      error: 'MySQL is unavailable. Check the Vercel database environment variables, database access, and network settings.',
    });
  }
});

const createSession = async (userId) => {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await pool.query(
    `INSERT INTO user_sessions (tokenHash, userId, expiresAt) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
    [tokenHash, userId]
  );
  return token;
};

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in is required.' });

  try {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      `SELECT users.id, users.role FROM user_sessions
       JOIN users ON users.id = user_sessions.userId
       WHERE user_sessions.tokenHash = ? AND user_sessions.expiresAt > NOW()`,
      [tokenHash]
    );
    if (!rows.length) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    req.authUser = rows[0];
    next();
  } catch (err) {
    console.error('Error validating session:', err);
    res.status(500).json({ error: 'Could not validate your session.' });
  }
};

const requireOwnAccount = (req, res, next) => {
  if (req.authUser?.id !== req.params.userId) {
    return res.status(403).json({ error: 'You cannot access another account’s data.' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.authUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }
  next();
};

// ======================= AUTH ROUTES =======================

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, avatar, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const [existing] = await pool.query(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`, [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr-${Date.now()}`;
    const userAvatar = avatar || null;
    const userPhone = phone || '+1 (555) 000-0000';
    const userAddress = address || '123 Fresh Cart Street, Cityville, ST 12345';

    await pool.query(
      `INSERT INTO users (id, name, email, password, role, avatar, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, password, 'user', userAvatar, userPhone, userAddress]
    );

    const newUser = {
      id: userId,
      name,
      email,
      role: 'user',
      avatar: userAvatar,
      phone: userPhone,
      address: userAddress,
    };
    const token = await createSession(userId);

    res.status(201).json({ message: 'Registration successful!', user: newUser, token });
  } catch (err) {
    console.error('Error in registration:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !['admin', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Email, password, and a valid account role are required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM users
       WHERE LOWER(email) = LOWER(?)
         AND password = ?
         AND (
           (? = 'admin' AND LOWER(TRIM(role)) IN ('admin', 'administrator'))
           OR (? = 'user' AND LOWER(TRIM(role)) IN ('user', 'customer'))
         )`,
      [email.trim(), password, role, role]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    user.role = ['admin', 'administrator'].includes(String(user.role).trim().toLowerCase())
      ? 'admin'
      : 'user';
    delete user.password;
    const token = await createSession(user.id);

    res.json({ message: 'Login successful!', user, token });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// The authenticated session identifies the account; the client does not choose a user ID.
app.get('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [req.authUser.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = rows[0];
    delete user.password;
    res.json({ user });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Could not load account profile.' });
  }
});

app.put('/api/auth/profile', authenticate, async (req, res) => {
  const profile = req.body && typeof req.body === 'object' && !Array.isArray(req.body)
    ? req.body
    : {};
  const fields = ['name', 'phone', 'avatar', 'address']
    .filter((field) => Object.hasOwn(profile, field));
  if (!fields.length) {
    return res.status(400).json({ error: 'At least one profile field is required.' });
  }
  if (Object.hasOwn(profile, 'name') && (typeof profile.name !== 'string' || !profile.name.trim())) {
    return res.status(400).json({ error: 'Name cannot be empty.' });
  }
  if (fields.some((field) => (
    field !== 'name' && profile[field] !== null && typeof profile[field] !== 'string'
  ))) {
    return res.status(400).json({ error: 'Profile fields must be text values.' });
  }

  try {
    const assignments = fields.map((field) => `\`${field}\` = ?`).join(', ');
    const values = fields.map((field) => (
      field === 'name' ? profile[field].trim() : profile[field]
    ));
    await pool.query(
      `UPDATE users SET ${assignments} WHERE id = ?`,
      [...values, req.authUser.id]
    );

    const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [req.authUser.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updatedUser = rows[0];
    delete updatedUser.password;

    res.json({ message: 'Profile updated successfully!', user: updatedUser });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error updating user profile.' });
  }
});

app.delete('/api/auth/session', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.match(/^Bearer ([a-f0-9]{64})$/i)[1];
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await pool.query(`DELETE FROM user_sessions WHERE tokenHash = ?`, [tokenHash]);
    res.json({ message: 'Signed out successfully.' });
  } catch (err) {
    console.error('Error ending session:', err);
    res.status(500).json({ error: 'Could not sign out.' });
  }
});

const allowedUserDataTypes = new Set(['cart', 'wishlist', 'addresses']);

app.get('/api/users/:userId/data/:dataType', authenticate, requireOwnAccount, async (req, res) => {
  const { userId, dataType } = req.params;
  if (dataType === 'orders') {
    return res.status(400).json({ error: 'Orders are managed through the order service.' });
  }
  if (!allowedUserDataTypes.has(dataType)) {
    return res.status(400).json({ error: 'Unsupported user data type.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT payload FROM user_data WHERE userId = ? AND dataType = ?`,
      [userId, dataType]
    );
    res.json(rows.length ? JSON.parse(rows[0].payload) : []);
  } catch (err) {
    console.error(`Error fetching ${dataType} for user:`, err);
    res.status(500).json({ error: `Could not load ${dataType} data.` });
  }
});

app.put('/api/users/:userId/data/:dataType', authenticate, requireOwnAccount, async (req, res) => {
  const { userId, dataType } = req.params;
  if (dataType === 'orders') {
    return res.status(400).json({ error: 'Orders must be created through the order service.' });
  }
  if (!allowedUserDataTypes.has(dataType)) {
    return res.status(400).json({ error: 'Unsupported user data type.' });
  }
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'User data must be an array.' });
  }

  try {
    const [users] = await pool.query(`SELECT id FROM users WHERE id = ?`, [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await pool.query(
      `INSERT INTO user_data (userId, dataType, payload) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload)`,
      [userId, dataType, JSON.stringify(req.body)]
    );
    res.json({ message: `${dataType} saved successfully.` });
  } catch (err) {
    console.error(`Error saving ${dataType} for user:`, err);
    res.status(500).json({ error: `Could not save ${dataType} data.` });
  }
});

app.post('/api/orders', authenticate, async (req, res) => {
  const { id, total, deliveryAddress, paymentMethod, items } = req.body;
  const numericTotal = Number(total);
  if (
    typeof id !== 'string' ||
    !id.trim() ||
    !Number.isFinite(numericTotal) ||
    numericTotal < 0 ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((item) => (
      typeof item?.name !== 'string' ||
      !item.name.trim() ||
      !Number.isFinite(Number(item.qty)) ||
      !Number.isInteger(Number(item.qty)) ||
      Number(item.qty) < 1 ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) < 0
    ))
  ) {
    return res.status(400).json({ error: 'A valid order with at least one item is required.' });
  }

  const order = {
    id: id.trim(),
    date: new Date().toISOString(),
    total: numericTotal,
    status: 'processing',
    deliveryAddress: deliveryAddress || null,
    paymentMethod: typeof paymentMethod === 'string' ? paymentMethod : 'cash-or-card-on-delivery',
    items: items.map((item) => ({
      name: item.name,
      qty: Number(item.qty),
      price: Number(item.price),
      image: typeof item.image === 'string' ? item.image : '',
    })),
  };

  try {
    await pool.query(
      `INSERT INTO orders (id, userId, total, status, payload) VALUES (?, ?, ?, ?, ?)`,
      [order.id, req.authUser.id, order.total, order.status, JSON.stringify(order)]
    );
    res.status(201).json({ message: 'Order placed successfully.', order });
  } catch (err) {
    console.error('Error saving order:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This order ID already exists. Please try placing the order again.' });
    }
    res.status(500).json({ error: 'Could not save your order.' });
  }
});

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT payload FROM orders WHERE userId = ? ORDER BY createdAt DESC`,
      [req.authUser.id]
    );
    res.json(rows.map((row) => JSON.parse(row.payload)));
  } catch (err) {
    console.error('Error fetching account orders:', err);
    res.status(500).json({ error: 'Could not load your order history.' });
  }
});

app.get('/api/admin/orders', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT orders.payload, users.id AS userId, users.name AS userName, users.email AS userEmail
       FROM orders
       JOIN users ON users.id = orders.userId
       ORDER BY orders.createdAt DESC`
    );
    res.json(rows.map((row) => ({
      ...JSON.parse(row.payload),
      user: { id: row.userId, name: row.userName, email: row.userEmail },
    })));
  } catch (err) {
    console.error('Error fetching administrator orders:', err);
    res.status(500).json({ error: 'Could not load all customer orders.' });
  }
});

app.get('/api/admin/summary', authenticate, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orderCount FROM orders`
    );
    res.json({ revenue: Number(rows[0].revenue), orderCount: Number(rows[0].orderCount) });
  } catch (err) {
    console.error('Error calculating admin summary:', err);
    res.status(500).json({ error: 'Could not load administrator dashboard data.' });
  }
});

// ======================= CATEGORY ROUTES =======================

// Get All Categories
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM categories ORDER BY name ASC`);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching categories.' });
  }
});

// Add Category
app.post('/api/categories', authenticate, requireAdmin, async (req, res) => {
  const { name, slug, icon, image } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const catId = `cat-${Date.now()}`;
  const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const catIcon = icon || '🌱';
  const catImage = image || null;

  try {
    await pool.query(
      `INSERT INTO categories (id, slug, name, icon, image, productCount) VALUES (?, ?, ?, ?, ?, 0)`,
      [catId, catSlug, name, catIcon, catImage]
    );

    const created = { id: catId, slug: catSlug, name, icon: catIcon, image: catImage, productCount: 0 };
    res.status(201).json({ message: 'Category created successfully', category: created });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ error: 'Error creating category in database.' });
  }
});

// Edit Category
app.put('/api/categories/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, slug, icon, image } = req.body;
  const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  try {
    const [result] = await pool.query(
      `UPDATE categories SET name = ?, slug = ?, icon = ?, image = ? WHERE id = ?`,
      [name, catSlug, icon, image, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    res.json({ message: 'Category updated successfully' });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ error: 'Error updating category.' });
  }
});

// Delete Category
app.delete('/api/categories/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM categories WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found.' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting category.' });
  }
});

// ======================= PRODUCT ROUTES =======================

// Get All Products
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT * FROM products ORDER BY id DESC`);
    const formatted = rows.map((p) => ({
      ...p,
      price: parseFloat(p.price),
      originalPrice: parseFloat(p.originalPrice),
      stockCount: parseInt(p.stockCount),
      rating: parseFloat(p.rating),
      reviewCount: parseInt(p.reviewCount),
      isOrganic: Boolean(p.isOrganic),
      isFeatured: Boolean(p.isFeatured),
      inStock: Boolean(p.inStock),
      gallery: [p.image]
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Error fetching products from MySQL database.' });
  }
});

// Add Product
app.post('/api/products', authenticate, requireAdmin, async (req, res) => {
  const { name, category, categoryName, price, originalPrice, weight, stockCount, image, description, isOrganic, isFeatured } = req.body;

  const prodId = `p_${Date.now()}`;
  const prodPrice = parseFloat(price) || 0;
  const origPrice = parseFloat(originalPrice) || (prodPrice * 1.25);
  const stock = parseInt(stockCount) || 50;

  try {
    await pool.query(
      `INSERT INTO products (id, name, category, categoryName, price, originalPrice, weight, stockCount, image, description, isOrganic, isFeatured, inStock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prodId,
        name || 'Untitled Product',
        category || 'veg',
        categoryName || 'Fresh Vegetables',
        prodPrice,
        origPrice,
        weight || '500g',
        stock,
        image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        description || 'Fresh quality product.',
        isOrganic ? 1 : 0,
        isFeatured ? 1 : 0,
        stock > 0 ? 1 : 0
      ]
    );

    const created = {
      id: prodId,
      name,
      category,
      categoryName,
      price: prodPrice,
      originalPrice: origPrice,
      weight,
      stockCount: stock,
      image,
      description,
      isOrganic,
      isFeatured,
      inStock: stock > 0,
      rating: 5.0,
      reviewCount: 1,
      gallery: [image]
    };

    res.status(201).json({ message: 'Product created successfully in fresh_cart', product: created });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Error creating product in MySQL database.' });
  }
});

// Edit Product
app.put('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  const { name, category, categoryName, price, originalPrice, weight, stockCount, image, description, isOrganic, isFeatured } = req.body;

  const prodPrice = parseFloat(price);
  const origPrice = parseFloat(originalPrice) || (prodPrice * 1.25);
  const stock = parseInt(stockCount);

  try {
    const [result] = await pool.query(
      `UPDATE products SET name = ?, category = ?, categoryName = ?, price = ?, originalPrice = ?, weight = ?, stockCount = ?, image = ?, description = ?, isOrganic = ?, isFeatured = ?, inStock = ? WHERE id = ?`,
      [
        name,
        category,
        categoryName,
        prodPrice,
        origPrice,
        weight || '500g',
        stock,
        image,
        description,
        isOrganic ? 1 : 0,
        isFeatured ? 1 : 0,
        stock > 0 ? 1 : 0,
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json({ message: 'Product updated successfully in MySQL database' });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ error: 'Error updating product in MySQL database.' });
  }
});

// Update Stock Count
app.put('/api/products/:id/stock', authenticate, requireAdmin, async (req, res) => {
  const { stockCount } = req.body;
  const stock = parseInt(stockCount);

  try {
    await pool.query(
      `UPDATE products SET stockCount = ?, inStock = ? WHERE id = ?`,
      [stock, stock > 0 ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Stock updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating stock.' });
  }
});

// Delete Product
app.delete('/api/products/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const [result] = await pool.query(`DELETE FROM products WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json({ message: 'Product deleted successfully from MySQL database' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting product.' });
  }
});

export default app;

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  app.listen(PORT, () => {
    console.log(`⚡ [FreshCart MySQL Server] running on http://localhost:${PORT}`);
  });
}
