import { Router } from 'express';
import multer from 'multer';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendApplicationConfirmation, notifyStaffNewApplication } from '../lib/email.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const baseDir = process.env.UPLOAD_DIR || join(__dirname, '..', '..', 'uploads');
const applicationsDir = join(baseDir, 'applications');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await mkdir(applicationsDir, { recursive: true });
    cb(null, applicationsDir);
  },
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

export const applicationsRouter = Router();

// ——— Public: submit application (Stories 4.1–4.3) ———
applicationsRouter.post('/', upload.single('attachment'), async (req, res) => {
  try {
    const { type, name, email, phone, ...rest } = req.body || {};
    if (!type || !name || !email) return res.status(400).json({ error: 'type, name, and email required' });
    if (!['volunteer', 'intern', 'consultant'].includes(type)) return res.status(400).json({ error: 'type must be volunteer, intern, or consultant' });
    if (type === 'intern' && !req.file) return res.status(400).json({ error: 'CV upload required for intern applications' });

    const data = { ...rest };
    if (req.file) data.attachmentName = req.file.originalname;

    const { rows } = await pool.query(
      `INSERT INTO applications (type, name, email, phone, data, attachment_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'received')
       RETURNING id, type, name, email, created_at`,
      [type, name, email, phone || null, JSON.stringify(data), req.file ? req.file.path : null]
    );
    const app = rows[0];

    // FR-4.2.1: Confirmation email to applicant
    sendApplicationConfirmation({ to: app.email, name: app.name, type: app.type, applicationId: app.id }).catch(() => {});

    // FR-4.2.2: Notify PSPBA staff of new application
    notifyStaffNewApplication({
      applicantName: app.name,
      applicantEmail: app.email,
      type: app.type,
      applicationId: app.id,
    }).catch(() => {});

    res.status(201).json({
      id: app.id,
      message: 'Application received. You will receive a confirmation email shortly.',
      type: app.type,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: applicant status lookup (id + email required for verification) ———
applicationsRouter.get('/status', async (req, res) => {
  try {
    const { id, email } = req.query;
    if (!id || !email) return res.status(400).json({ error: 'Application ID and email required' });
    const { rows } = await pool.query(
      'SELECT id, type, status, created_at FROM applications WHERE id = $1 AND LOWER(email) = LOWER($2)',
      [id, email]
    );
    if (!rows.length) return res.status(404).json({ error: 'Application not found. Check your ID and email.' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: list applications ———
applicationsRouter.get('/admin', requireAuth, requireRole('merl', 'strategic_communications', 'ict', 'programme', 'admin'), async (req, res) => {
  try {
    const { type, status, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT id, type, name, email, phone, data, attachment_path, status, created_at FROM applications WHERE 1=1';
    const params = [];
    let n = 1;
    if (type) { sql += ` AND type = $${n}`; params.push(type); n++; }
    if (status) { sql += ` AND status = $${n}`; params.push(status); n++; }
    sql += ` ORDER BY created_at DESC LIMIT $${n} OFFSET $${n + 1}`;
    params.push(Math.min(parseInt(limit, 10) || 100, 200), parseInt(offset, 10) || 0);
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

applicationsRouter.get('/admin/:id', requireAuth, requireRole('merl', 'strategic_communications', 'ict', 'programme', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: download application attachment (CV) ———
applicationsRouter.get('/admin/:id/download', requireAuth, requireRole('merl', 'strategic_communications', 'ict', 'programme', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT attachment_path, data, name, type FROM applications WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Application not found' });
    const app = rows[0];
    if (!app.attachment_path) return res.status(404).json({ error: 'No attachment for this application' });
    const filePath = resolve(app.attachment_path);
    const originalName = app.data?.attachmentName || `${app.name.replace(/\s+/g, '_')}_CV`;
    res.download(filePath, originalName, (err) => {
      if (err && !res.headersSent) res.status(404).json({ error: 'File not found on disk' });
    });
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

applicationsRouter.patch('/admin/:id', requireAuth, requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status required' });
    const { rows } = await pool.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING id, type, name, email, status, created_at',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
