import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.department, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1`,
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, department: user.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        department: user.department,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Change own password (any authenticated user) ———
authRouter.patch('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.sub]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.sub]);
    res.json({ message: 'Password updated' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: list users (admin only) ———
authRouter.get('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.department, u.created_at, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: create user (admin only) ———
authRouter.post('/users', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const { rows: roles } = await pool.query('SELECT id FROM roles WHERE name = $1', [role || 'merl']);
    if (!roles.length) return res.status(400).json({ error: 'Invalid role' });
    const hash = await bcrypt.hash(password, 10);
    const roleName = role || 'merl';
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, role_id, department) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, created_at',
      [email.trim().toLowerCase(), hash, full_name || null, roles[0].id, roleName]
    );
    res.status(201).json({ ...rows[0], role: roleName });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Email already in use' });
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: list roles (admin only) ———
authRouter.get('/roles', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, created_at FROM roles ORDER BY name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: create role ———
authRouter.post('/roles', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name required' });
    const safeName = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    if (!safeName) return res.status(400).json({ error: 'Invalid role name' });
    const { rows } = await pool.query(
      'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at',
      [safeName, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Role already exists' });
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: update user role ———
authRouter.patch('/users/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role required' });
    const { rows: roles } = await pool.query('SELECT id FROM roles WHERE name = $1', [role]);
    if (!roles.length) return res.status(400).json({ error: 'Invalid role' });
    const { rows } = await pool.query(
      'UPDATE users SET role_id = $1, department = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, full_name',
      [roles[0].id, role, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ ...rows[0], role });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Seed one admin user if no users exist (dev only)
authRouter.post('/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden' });
  const { rows } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (rows.length) return res.status(400).json({ error: 'Users already exist' });
  const hash = await bcrypt.hash('admin123', 10);
  const { rows: roles } = await pool.query("SELECT id FROM roles WHERE name = 'admin'");
  await pool.query(
    'INSERT INTO users (email, password_hash, full_name, role_id, department) VALUES ($1, $2, $3, $4, $5)',
    ['admin@pspba.org', hash, 'Admin User', roles[0].id, 'admin']
  );
  res.json({ message: 'Admin user created. Login with admin@pspba.org / admin123' });
});
