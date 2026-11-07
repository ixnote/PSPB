import { Router } from 'express';
import multer from 'multer';
import { copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '..', '..', 'uploads');
const backupDir = process.env.LOCAL_BACKUP_DIR || join(__dirname, '..', '..', 'backups');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + (file.originalname || 'file').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB

export const kmsRouter = Router();
kmsRouter.use(requireAuth);

// List documents (with optional filters: project, thematic_area, date range, type, author)
kmsRouter.get('/documents', async (req, res) => {
  try {
    const { project, thematic_area, from, to, type, author, q } = req.query;
    let sql = `
      SELECT d.id, d.title, d.file_name, d.file_path, d.file_size, d.mime_type,
             d.project, d.thematic_area, d.document_type_id, d.published_to_website, d.access_level,
             dt.name AS document_type,
             d.uploaded_by, d.created_at, d.updated_at, d.metadata,
             u.full_name AS author_name, u.email AS author_email
      FROM documents d
      LEFT JOIN document_types dt ON d.document_type_id = dt.id
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let n = 1;
    if (project) { sql += ` AND d.project = $${n}`; params.push(project); n++; }
    if (thematic_area) { sql += ` AND d.thematic_area = $${n}`; params.push(thematic_area); n++; }
    if (from) { sql += ` AND d.created_at >= $${n}`; params.push(from); n++; }
    if (to) { sql += ` AND d.created_at <= $${n}`; params.push(to); n++; }
    if (type) { sql += ` AND dt.name = $${n}`; params.push(type); n++; }
    if (author) { sql += ` AND (u.full_name ILIKE $${n} OR u.email ILIKE $${n})`; params.push(`%${author}%`); n++; }
    if (q) {
      sql += ` AND (d.title ILIKE $${n} OR d.project ILIKE $${n} OR d.thematic_area ILIKE $${n} OR d.metadata::text ILIKE $${n})`;
      params.push(`%${q}%`);
      n++;
    }
    sql += ` ORDER BY d.created_at DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Facets for filters (must be before /documents/:id)
kmsRouter.get('/documents/facets', async (req, res) => {
  try {
    const [projects, thematic, types] = await Promise.all([
      pool.query('SELECT DISTINCT project AS value FROM documents WHERE project IS NOT NULL ORDER BY project'),
      pool.query('SELECT DISTINCT thematic_area AS value FROM documents WHERE thematic_area IS NOT NULL ORDER BY thematic_area'),
      pool.query('SELECT id, name FROM document_types ORDER BY name'),
    ]);
    res.json({
      projects: projects.rows.map((r) => r.value),
      thematicAreas: thematic.rows.map((r) => r.value),
      documentTypes: types.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get one document + version history
kmsRouter.get('/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: docs } = await pool.query(
      `SELECT d.*, dt.name AS document_type, u.full_name AS author_name
       FROM documents d
       LEFT JOIN document_types dt ON d.document_type_id = dt.id
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = $1`,
      [id]
    );
    if (!docs.length) return res.status(404).json({ error: 'Document not found' });
    const { rows: versions } = await pool.query(
      'SELECT id, version_number, file_path, uploaded_by, created_at FROM document_versions WHERE document_id = $1 ORDER BY version_number DESC',
      [id]
    );
    // Log access
    await pool.query(
      'INSERT INTO document_access_log (document_id, user_id, action) VALUES ($1, $2, $3)',
      [id, req.user.sub, 'view']
    );
    res.json({ ...docs[0], versions });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upload document (Story 1.1: cloud storage + local backup; categorization FR-1.1.2)
kmsRouter.post('/documents', requireRole('merl', 'strategic_communications', 'ict', 'programme', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { title, project, thematic_area, document_type } = req.body;
    let documentTypeId = null;
    if (document_type) {
      const { rows } = await pool.query('SELECT id FROM document_types WHERE name = $1', [document_type]);
      if (rows.length) documentTypeId = rows[0].id;
    }
    const { rows } = await pool.query(
      `INSERT INTO documents (title, file_name, file_path, file_size, mime_type, project, thematic_area, document_type_id, uploaded_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, file_name, file_path, project, thematic_area, document_type_id, created_at`,
      [
        title || req.file.originalname,
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        project || null,
        thematic_area || null,
        documentTypeId,
        req.user.sub,
        JSON.stringify({ author: req.user.email, uploadedAt: new Date().toISOString() }),
      ]
    );
    const doc = rows[0];
    // Local backup (FR-1.1.1)
    const backupPath = join(backupDir, `doc-${doc.id}-v1`);
    await mkdir(backupDir, { recursive: true });
    await copyFile(req.file.path, backupPath);
    // Initial version
    await pool.query(
      'INSERT INTO document_versions (document_id, version_number, file_path, uploaded_by) VALUES ($1, 1, $2, $3)',
      [doc.id, req.file.path, req.user.sub]
    );
    res.status(201).json({ ...doc, message: 'Upload successful. Local backup created.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update document metadata (Story 1.2)
kmsRouter.patch('/documents/:id', requireRole('merl', 'strategic_communications', 'ict', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, project, thematic_area, document_type, metadata, access_level } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (title !== undefined) { updates.push(`title = $${n}`); params.push(title); n++; }
    if (project !== undefined) { updates.push(`project = $${n}`); params.push(project); n++; }
    if (thematic_area !== undefined) { updates.push(`thematic_area = $${n}`); params.push(thematic_area); n++; }
    if (metadata !== undefined) { updates.push(`metadata = metadata || $${n}::jsonb`); params.push(JSON.stringify(metadata)); n++; }
    if (access_level !== undefined && ['public', 'private'].includes(access_level)) { updates.push(`access_level = $${n}`); params.push(access_level); n++; }
    if (document_type !== undefined) {
      const { rows } = await pool.query('SELECT id FROM document_types WHERE name = $1', [document_type]);
      if (rows.length) { updates.push(`document_type_id = $${n}`); params.push(rows[0].id); n++; }
    }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE documents SET ${updates.join(', ')} WHERE id = $${n} RETURNING id, title, project, thematic_area, document_type_id, metadata, updated_at`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Document not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Analytics: access log and gap hints (Story 1.6)
kmsRouter.get('/analytics/access', requireRole('merl', 'admin'), async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    let sql = `
      SELECT l.id, l.document_id, l.user_id, l.action, l.created_at,
             d.title AS document_title, u.email AS user_email
      FROM document_access_log l
      LEFT JOIN documents d ON l.document_id = d.id
      LEFT JOIN users u ON l.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let n = 1;
    if (from) { sql += ` AND l.created_at >= $${n}`; params.push(from); n++; }
    if (to) { sql += ` AND l.created_at <= $${n}`; params.push(to); n++; }
    params.push(limit);
    sql += ` ORDER BY l.created_at DESC LIMIT $${n}`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

kmsRouter.get('/analytics/summary', requireRole('merl', 'admin'), async (req, res) => {
  try {
    const [byDoc, byUser, total] = await Promise.all([
      pool.query(`SELECT document_id, COUNT(*) AS views FROM document_access_log WHERE action = 'view' GROUP BY document_id ORDER BY views DESC LIMIT 20`),
      pool.query(`SELECT user_id, COUNT(*) AS actions FROM document_access_log GROUP BY user_id ORDER BY actions DESC LIMIT 20`),
      pool.query('SELECT COUNT(*) AS total FROM documents'),
    ]);
    res.json({
      topDocuments: byDoc.rows,
      topUsers: byUser.rows,
      totalDocuments: parseInt(total.rows[0].total, 10),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
