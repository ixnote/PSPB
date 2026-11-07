import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendDocumentToRequester } from '../lib/email.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

export const websiteRouter = Router();

const slugify = (s) => (s || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + (file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safe);
  },
});
const galleryUpload = multer({ storage: galleryStorage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// News post featured image upload
const newsStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-news-' + (file.originalname || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safe);
  },
});
const newsUpload = multer({ storage: newsStorage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// ——— Public: serve uploaded files (gallery images, etc.) ———
websiteRouter.get('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) return res.status(400).json({ error: 'Invalid filename' });
  const filePath = path.join(uploadDir, filename);
  const resolved = path.resolve(filePath);
  const uploadResolved = path.resolve(uploadDir);
  if (!resolved.startsWith(uploadResolved)) return res.status(403).json({ error: 'Forbidden' });
  res.sendFile(resolved, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: 'Not found' });
  });
});

// ——— Public: departments list (for dropdowns) ———
websiteRouter.get('/departments', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name FROM departments ORDER BY sort_order, name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: departments CRUD ———
websiteRouter.get('/admin/departments', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM departments ORDER BY sort_order, name');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/departments', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { name, sort_order } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Department name is required' });
    const { rows } = await pool.query(
      'INSERT INTO departments (name, sort_order) VALUES ($1, $2) RETURNING *',
      [name.trim(), parseInt(sort_order, 10) || 0]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Department already exists' });
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/departments/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sort_order } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (name !== undefined) { updates.push(`name = $${n}`); params.push(name.trim()); n++; }
    if (sort_order !== undefined) { updates.push(`sort_order = $${n}`); params.push(parseInt(sort_order, 10) || 0); n++; }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE departments SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Department name already exists' });
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/departments/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM departments WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: homepage stats (live counts for the impact banner) ———
websiteRouter.get('/homepage-stats', async (req, res) => {
  try {
    const [lgas, events, actors] = await Promise.all([
      pool.query('SELECT COUNT(DISTINCT lga)::int AS count FROM conflict_incidents'),
      pool.query("SELECT COUNT(*)::int AS count FROM events WHERE status = 'published'"),
      pool.query('SELECT COUNT(*)::int AS count FROM peacebuilding_actors'),
    ]);
    res.json({
      lgasCovered: lgas.rows[0].count,
      dialoguesHeld: events.rows[0].count,
      peaceActors: actors.rows[0].count,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: partners ———
websiteRouter.get('/partners', async (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 20, 100);
    const off = parseInt(offset, 10) || 0;
    let where = '1=1';
    const params = [];
    let n = 1;
    if (category) { where += ` AND category = $${n}`; params.push(category); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM partners WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT id, name, url, category, logo_path FROM partners WHERE ${where} ORDER BY category, sort_order, name LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: homepage carousel (galleries + news for hero) ———
websiteRouter.get('/homepage-carousel', async (req, res) => {
  try {
    const [galleries, news] = await Promise.all([
      pool.query(
        `SELECT g.id, g.title, g.slug,
                COALESCE(g.cover_image_path, (SELECT gi.file_path FROM gallery_items gi WHERE gi.gallery_id = g.id ORDER BY gi.sort_order, gi.id LIMIT 1)) AS cover_image_path,
                g.description
         FROM galleries g WHERE g.status = 'published'
           AND COALESCE(g.cover_image_path, (SELECT gi.file_path FROM gallery_items gi WHERE gi.gallery_id = g.id ORDER BY gi.sort_order, gi.id LIMIT 1)) IS NOT NULL
         ORDER BY COALESCE(g.published_at, g.updated_at) DESC LIMIT 5`
      ),
      pool.query(
        `SELECT id, title, slug, excerpt, featured_image_path FROM news_posts WHERE status = 'published'
         ORDER BY published_at DESC NULLS LAST LIMIT 5`
      ),
    ]);
    const items = [
      ...galleries.rows.map((g) => ({ type: 'gallery', id: `g-${g.id}`, title: g.title, slug: g.slug, imagePath: g.cover_image_path, excerpt: g.description, link: `/galleries/${g.slug}` })),
      ...news.rows.map((n) => ({ type: 'news', id: `n-${n.id}`, title: n.title, slug: n.slug, imagePath: n.featured_image_path || null, excerpt: n.excerpt, link: `/news/${n.slug}` })),
    ].slice(0, 8);
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: galleries ———
websiteRouter.get('/galleries', async (req, res) => {
  try {
    const { search, limit = 12, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 12, 50);
    const off = parseInt(offset, 10) || 0;
    let where = "g.status = 'published'";
    const params = [];
    let n = 1;
    if (search) { where += ` AND (g.title ILIKE $${n} OR g.description ILIKE $${n})`; params.push(`%${search}%`); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM galleries g WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT g.id, g.title, g.slug, g.description,
              COALESCE(g.cover_image_path, (SELECT gi.file_path FROM gallery_items gi WHERE gi.gallery_id = g.id ORDER BY gi.sort_order, gi.id LIMIT 1)) AS cover_image_path,
              g.published_at, g.updated_at
       FROM galleries g WHERE ${where}
       ORDER BY COALESCE(g.published_at, g.updated_at) DESC LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/galleries/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT g.id, g.title, g.slug, g.description,
              COALESCE(g.cover_image_path, (SELECT gi.file_path FROM gallery_items gi WHERE gi.gallery_id = g.id ORDER BY gi.sort_order, gi.id LIMIT 1)) AS cover_image_path,
              g.published_at, g.updated_at
       FROM galleries g WHERE g.slug = $1 AND g.status = 'published'`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const gallery = rows[0];
    const { rows: items } = await pool.query(
      'SELECT id, file_path, caption, sort_order FROM gallery_items WHERE gallery_id = $1 ORDER BY sort_order, id',
      [gallery.id]
    );
    gallery.items = items;
    res.json(gallery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: content pages (e.g. /about) ———
websiteRouter.get('/pages', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, slug, title, body, updated_at FROM content_pages WHERE status = 'published' ORDER BY slug"
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/pages/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, slug, title, body, published_at, updated_at FROM content_pages WHERE slug = $1 AND status = 'published'",
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: news ———
websiteRouter.get('/news', async (req, res) => {
  try {
    const { limit = 12, offset = 0, search } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 12, 50);
    const off = parseInt(offset, 10) || 0;
    let where = "status = 'published'";
    const params = [];
    let n = 1;
    if (search) { where += ` AND (title ILIKE $${n} OR excerpt ILIKE $${n})`; params.push(`%${search}%`); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM news_posts WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT id, title, slug, excerpt, featured_image_path, published_at FROM news_posts WHERE ${where} ORDER BY published_at DESC NULLS LAST LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/news/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, title, slug, excerpt, body, featured_image_path, published_at, updated_at FROM news_posts WHERE slug = $1 AND status = 'published'",
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: events ———
websiteRouter.get('/events', async (req, res) => {
  try {
    const { from, to, search, limit = 12, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 12, 50);
    const off = parseInt(offset, 10) || 0;
    let where = "status = 'published'";
    const params = [];
    let n = 1;
    if (from) { where += ` AND start_at >= $${n}`; params.push(from); n++; }
    if (to) { where += ` AND start_at <= $${n}`; params.push(to); n++; }
    if (search) { where += ` AND (title ILIKE $${n} OR description ILIKE $${n} OR location ILIKE $${n})`; params.push(`%${search}%`); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM events WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT id, title, description, start_at, end_at, location FROM events WHERE ${where} ORDER BY CASE WHEN start_at >= NOW() THEN 0 ELSE 1 END, CASE WHEN start_at >= NOW() THEN start_at END ASC, CASE WHEN start_at < NOW() THEN start_at END DESC LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: published documents (repository) ———
websiteRouter.get('/repository', async (req, res) => {
  try {
    const { search, limit = 15, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 15, 100);
    const off = parseInt(offset, 10) || 0;
    let where = 'd.published_to_website = true';
    const params = [];
    let n = 1;
    if (search) { where += ` AND (d.title ILIKE $${n} OR d.file_name ILIKE $${n} OR dt.name ILIKE $${n})`; params.push(`%${search}%`); n++; }
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM documents d LEFT JOIN document_types dt ON d.document_type_id = dt.id WHERE ${where}`, params
    );
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT d.id, d.title, d.file_name, d.created_at, d.access_level, dt.name AS document_type
       FROM documents d
       LEFT JOIN document_types dt ON d.document_type_id = dt.id
       WHERE ${where}
       ORDER BY d.created_at DESC LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: download published document ———
websiteRouter.get('/repository/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT id, file_path, file_name, mime_type FROM documents WHERE id = $1 AND published_to_website = true AND access_level = 'public'",
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const doc = rows[0];
    const rawPath = doc.file_path;
    const filePath = path.isAbsolute(rawPath) ? path.resolve(rawPath) : path.resolve(path.join(uploadDir, rawPath));
    const uploadResolved = path.resolve(uploadDir);
    if (!filePath.startsWith(uploadResolved)) return res.status(403).json({ error: 'Forbidden' });
    res.download(filePath, doc.file_name || 'document', (err) => {
      if (err && !res.headersSent) res.status(500).json({ error: 'Download failed' });
    });
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

// ——— Public: request access to a private document ———
websiteRouter.post('/repository/:id/request', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, reason } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    const doc = await pool.query(
      "SELECT id, title FROM documents WHERE id = $1 AND published_to_website = true AND access_level = 'private'",
      [id]
    );
    if (!doc.rows.length) return res.status(404).json({ error: 'Document not found or not private' });
    const { rows } = await pool.query(
      'INSERT INTO document_requests (document_id, name, email, reason) VALUES ($1, $2, $3, $4) RETURNING id',
      [id, name, email, reason || null]
    );
    res.status(201).json({ id: rows[0].id, message: 'Request submitted. You will be contacted via email.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: contact form ———
websiteRouter.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message required' });
    await pool.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)',
      [name, email || null, subject || null, message]
    );
    res.status(202).json({ message: 'Thank you. We will get back to you.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: newsletter subscribe ———
websiteRouter.post('/newsletter', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await pool.query(
      'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );
    res.status(201).json({ message: 'Subscribed. You will receive updates.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: content pages CRUD ———
websiteRouter.use('/admin', requireAuth);

websiteRouter.get('/admin/pages', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, slug, title, status, published_at, updated_at FROM content_pages ORDER BY slug');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/admin/pages/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM content_pages WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/pages', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { slug, title, body, status } = req.body;
    const s = slug || slugify(title) || 'page';
    const { rows } = await pool.query(
      'INSERT INTO content_pages (slug, title, body, status, created_by, updated_by) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
      [s, title || 'Untitled', body || null, status || 'draft', req.user.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/pages/:id', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { slug, title, body, status } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (slug !== undefined) { updates.push(`slug = $${n}`); params.push(slug); n++; }
    if (title !== undefined) { updates.push(`title = $${n}`); params.push(title); n++; }
    if (body !== undefined) { updates.push(`body = $${n}`); params.push(body); n++; }
    if (status !== undefined) { updates.push(`status = $${n}`); params.push(status); n++; }
    if (status === 'published') { updates.push(`published_at = COALESCE(published_at, NOW())`); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`, `updated_by = $${n}`);
    params.push(req.user.sub);
    n++;
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE content_pages SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/pages/:id', requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM content_pages WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: news CRUD ———
websiteRouter.get('/admin/news', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, title, slug, status, published_at, created_at FROM news_posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/admin/news/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news_posts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/news', requireRole('merl', 'strategic_communications', 'programme', 'admin'), newsUpload.single('featured_image'), async (req, res) => {
  try {
    const { title, excerpt, body, status } = req.body;
    const slug = slugify(title) || `post-${Date.now()}`;
    const featured_image_path = req.file ? req.file.filename : null;
    const { rows } = await pool.query(
      'INSERT INTO news_posts (title, slug, excerpt, body, status, featured_image_path, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [title || 'Untitled', slug, excerpt || null, body || null, status || 'draft', featured_image_path, req.user.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/news/:id', requireRole('merl', 'strategic_communications', 'programme', 'admin'), newsUpload.single('featured_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, excerpt, body, status } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (title !== undefined) { updates.push(`title = $${n}`); params.push(title); n++; }
    if (slug !== undefined) { updates.push(`slug = $${n}`); params.push(slug); n++; }
    if (excerpt !== undefined) { updates.push(`excerpt = $${n}`); params.push(excerpt); n++; }
    if (body !== undefined) { updates.push(`body = $${n}`); params.push(body); n++; }
    if (status !== undefined) { updates.push(`status = $${n}`); params.push(status); n++; }
    if (req.file) { updates.push(`featured_image_path = $${n}`); params.push(req.file.filename); n++; }
    if (status === 'published') { updates.push(`published_at = COALESCE(published_at, NOW())`); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE news_posts SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/news/:id', requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM news_posts WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: events CRUD ———
websiteRouter.get('/admin/events', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, title, description, start_at, end_at, location, status, created_at FROM events ORDER BY start_at DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/admin/events/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/events', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { title, description, start_at, end_at, location, status } = req.body;
    if (!start_at) return res.status(400).json({ error: 'start_at required' });
    const { rows } = await pool.query(
      'INSERT INTO events (title, description, start_at, end_at, location, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title || 'Untitled', description || null, start_at, end_at || null, location || null, status || 'draft']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/events/:id', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_at, end_at, location, status } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (title !== undefined) { updates.push(`title = $${n}`); params.push(title); n++; }
    if (description !== undefined) { updates.push(`description = $${n}`); params.push(description); n++; }
    if (start_at !== undefined) { updates.push(`start_at = $${n}`); params.push(start_at); n++; }
    if (end_at !== undefined) { updates.push(`end_at = $${n}`); params.push(end_at); n++; }
    if (location !== undefined) { updates.push(`location = $${n}`); params.push(location); n++; }
    if (status !== undefined) { updates.push(`status = $${n}`); params.push(status); n++; }
    if (status === 'published') { updates.push(`published_at = COALESCE(published_at, NOW())`); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/events/:id', requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: galleries CRUD ———
websiteRouter.get('/admin/galleries', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, slug, description, cover_image_path, status, published_at, created_at, updated_at FROM galleries ORDER BY updated_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.get('/admin/galleries/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM galleries WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const gallery = rows[0];
    const { rows: items } = await pool.query(
      'SELECT id, file_path, caption, sort_order FROM gallery_items WHERE gallery_id = $1 ORDER BY sort_order, id',
      [gallery.id]
    );
    gallery.items = items;
    res.json(gallery);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/galleries', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { title, slug, description, status } = req.body;
    const s = slug || slugify(title) || `gallery-${Date.now()}`;
    const { rows } = await pool.query(
      'INSERT INTO galleries (title, slug, description, status, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title || 'Untitled', s, description || null, status || 'draft', req.user.sub]
    );
    if (rows[0].status === 'published') {
      await pool.query('UPDATE galleries SET published_at = COALESCE(published_at, NOW()) WHERE id = $1', [rows[0].id]);
    }
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/galleries/:id', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, cover_image_path, status } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (title !== undefined) { updates.push(`title = $${n}`); params.push(title); n++; }
    if (slug !== undefined) { updates.push(`slug = $${n}`); params.push(slug); n++; }
    if (description !== undefined) { updates.push(`description = $${n}`); params.push(description); n++; }
    if (cover_image_path !== undefined) { updates.push(`cover_image_path = $${n}`); params.push(cover_image_path); n++; }
    if (status !== undefined) { updates.push(`status = $${n}`); params.push(status); n++; }
    if (status === 'published') { updates.push(`published_at = COALESCE(published_at, NOW())`); }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE galleries SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/galleries/:id', requireRole('admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM galleries WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/galleries/:id/items', requireRole('merl', 'strategic_communications', 'programme', 'admin'), galleryUpload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'Image file required' });
    const { rows } = await pool.query(
      'INSERT INTO gallery_items (gallery_id, file_path, caption, sort_order) VALUES ($1, $2, $3, COALESCE((SELECT MAX(sort_order) + 1 FROM gallery_items WHERE gallery_id = $1), 0)) RETURNING *',
      [id, req.file.filename, req.body.caption || null]
    );
    // Auto-set cover image if the gallery doesn't have one yet
    await pool.query(
      'UPDATE galleries SET cover_image_path = $1 WHERE id = $2 AND cover_image_path IS NULL',
      [req.file.filename, id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/galleries/:galleryId/items/:itemId', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { caption, sort_order } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    if (caption !== undefined) { updates.push(`caption = $${n}`); params.push(caption); n++; }
    if (sort_order !== undefined) { updates.push(`sort_order = $${n}`); params.push(sort_order); n++; }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    params.push(req.params.galleryId, req.params.itemId);
    const { rows } = await pool.query(
      `UPDATE gallery_items SET ${updates.join(', ')} WHERE gallery_id = $${n} AND id = $${n + 1} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.delete('/admin/galleries/:galleryId/items/:itemId', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM gallery_items WHERE gallery_id = $1 AND id = $2',
      [req.params.galleryId, req.params.itemId]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: newsletter subscribers ———
websiteRouter.get('/admin/newsletter-subscribers', async (req, res) => {
  try {
    const { limit = 500 } = req.query;
    const { rows } = await pool.query(
      'SELECT id, email, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC LIMIT $1',
      [Math.min(parseInt(limit, 10) || 500, 2000)]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: contact messages (from public contact form) ———
websiteRouter.get('/admin/contact-messages', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const { rows } = await pool.query(
      'SELECT id, name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT $1',
      [Math.min(parseInt(limit, 10) || 50, 200)]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: publish from KMS (set document published_to_website) ———
websiteRouter.patch('/admin/documents/:id/publish', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;
    const { rows } = await pool.query(
      'UPDATE documents SET published_to_website = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, published_to_website',
      [published !== false, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: document access requests ———
websiteRouter.get('/admin/document-requests', requireAuth, requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { status: filterStatus, limit = 100 } = req.query;
    let where = '1=1';
    const params = [];
    let n = 1;
    if (filterStatus) { where += ` AND dr.status = $${n}`; params.push(filterStatus); n++; }
    params.push(Math.min(parseInt(limit, 10) || 100, 500));
    const { rows } = await pool.query(
      `SELECT dr.id, dr.document_id, dr.name, dr.email, dr.reason, dr.status, dr.created_at,
              d.title AS document_title
       FROM document_requests dr
       LEFT JOIN documents d ON dr.document_id = d.id
       WHERE ${where}
       ORDER BY dr.created_at DESC LIMIT $${n}`,
      params
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/document-requests/:id', requireAuth, requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    const { rows } = await pool.query(
      'UPDATE document_requests SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const request = rows[0];

    if (status === 'approved') {
      const doc = await pool.query('SELECT title, file_path, file_name FROM documents WHERE id = $1', [request.document_id]);
      if (doc.rows.length) {
        const { title, file_path, file_name } = doc.rows[0];
        const resolvedPath = path.isAbsolute(file_path) ? path.resolve(file_path) : path.resolve(path.join(uploadDir, file_path));
        sendDocumentToRequester({
          to: request.email,
          requesterName: request.name,
          documentTitle: title,
          filePath: resolvedPath,
          fileName: file_name || title,
        }).then((sent) => {
          if (!sent) console.warn(`[doc-request] Email not sent for request #${request.id} — SMTP may not be configured`);
        });
      }
    }

    res.json(request);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Admin: content approval (submit for approval / approve) ———
websiteRouter.get('/admin/approvals', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT a.*, u.email AS requested_by_email FROM content_approvals a LEFT JOIN users u ON a.requested_by = u.id WHERE a.status = $1 ORDER BY a.created_at DESC',
      ['pending']
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.post('/admin/approvals', requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { entity_type, entity_id } = req.body;
    if (!entity_type || !entity_id) return res.status(400).json({ error: 'entity_type and entity_id required' });
    const { rows } = await pool.query(
      'INSERT INTO content_approvals (entity_type, entity_id, requested_by, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [entity_type, entity_id, req.user.sub, 'pending']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

websiteRouter.patch('/admin/approvals/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'status must be approved or rejected' });
    const { rows } = await pool.query(
      'SELECT * FROM content_approvals WHERE id = $1 AND status = $2',
      [id, 'pending']
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    const approval = rows[0];
    await pool.query(
      'UPDATE content_approvals SET status = $1, approved_by = $2, resolved_at = NOW() WHERE id = $3',
      [status, req.user.sub, id]
    );
    if (status === 'approved') {
      if (approval.entity_type === 'document') {
        await pool.query('UPDATE documents SET published_to_website = true, updated_at = NOW() WHERE id = $1', [approval.entity_id]);
      } else if (approval.entity_type === 'content_page') {
        await pool.query("UPDATE content_pages SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = $1", [approval.entity_id]);
      } else if (approval.entity_type === 'news_post') {
        await pool.query("UPDATE news_posts SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = $1", [approval.entity_id]);
      } else if (approval.entity_type === 'event') {
        await pool.query("UPDATE events SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE id = $1", [approval.entity_id]);
      }
    }
    const { rows: updated } = await pool.query('SELECT * FROM content_approvals WHERE id = $1', [id]);
    res.json(updated[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ===========================
// TEAM MEMBERS
// ===========================

const teamStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-team-' + (file.originalname || 'photo').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, safe);
  },
});
const teamUpload = multer({ storage: teamStorage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Public: list active team members
websiteRouter.get('/team', async (req, res) => {
  try {
    const { category, limit = 12, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 12, 50);
    const off = parseInt(offset, 10) || 0;
    let where = 'is_active = TRUE';
    const params = [];
    let n = 1;
    if (category) { where += ` AND category = $${n}`; params.push(category); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM team_members WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT id, full_name, title, department, category, bio, photo_path, email, sort_order
       FROM team_members WHERE ${where} ORDER BY sort_order ASC, full_name ASC LIMIT $${n} OFFSET $${n+1}`,
      params
    );
    res.json({ rows, total: countRes.rows[0].total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: list all team members (including inactive)
websiteRouter.get('/team/admin', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM team_members ORDER BY sort_order ASC, full_name ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: create team member
websiteRouter.post('/team', requireAuth, requireRole('admin'), teamUpload.single('photo'), async (req, res) => {
  try {
    const { full_name, title, department, category, bio, email, phone, sort_order, is_active } = req.body;
    if (!full_name) return res.status(400).json({ error: 'Full name is required' });
    const photo_path = req.file ? req.file.filename : null;
    const { rows } = await pool.query(
      `INSERT INTO team_members (full_name, title, department, category, bio, photo_path, email, phone, sort_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [full_name, title || null, department || null, category || 'management', bio || null,
       photo_path, email || null, phone || null, parseInt(sort_order) || 0, is_active !== 'false']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: update team member
websiteRouter.patch('/team/:id', requireAuth, requireRole('admin'), teamUpload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, title, department, category, bio, email, phone, sort_order, is_active } = req.body;
    const existing = await pool.query('SELECT * FROM team_members WHERE id = $1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Not found' });
    const photo_path = req.file ? req.file.filename : existing.rows[0].photo_path;
    const { rows } = await pool.query(
      `UPDATE team_members SET full_name=$1, title=$2, department=$3, category=$4, bio=$5,
       photo_path=$6, email=$7, phone=$8, sort_order=$9, is_active=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [full_name || existing.rows[0].full_name, title ?? existing.rows[0].title,
       department ?? existing.rows[0].department, category || existing.rows[0].category,
       bio ?? existing.rows[0].bio, photo_path, email ?? existing.rows[0].email,
       phone ?? existing.rows[0].phone, parseInt(sort_order) || existing.rows[0].sort_order,
       is_active === 'false' ? false : true, id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: delete team member
websiteRouter.delete('/team/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM team_members WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——————————————————————————————————
// YouTube Videos
// ——————————————————————————————————

// Public: list published videos with pagination
websiteRouter.get('/videos', async (req, res) => {
  try {
    const { search, category, limit = 15, offset = 0 } = req.query;
    const lim = Math.min(parseInt(limit, 10) || 15, 50);
    const off = parseInt(offset, 10) || 0;
    let where = 'is_published = TRUE';
    const params = [];
    let n = 1;
    if (search) { where += ` AND (title ILIKE $${n} OR description ILIKE $${n})`; params.push(`%${search}%`); n++; }
    if (category) { where += ` AND category = $${n}`; params.push(category); n++; }
    const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM youtube_videos WHERE ${where}`, params);
    params.push(lim, off);
    const { rows } = await pool.query(
      `SELECT id, title, youtube_url, description, category, is_featured, sort_order, created_at
       FROM youtube_videos WHERE ${where}
       ORDER BY is_featured DESC, sort_order ASC, created_at DESC LIMIT $${n} OFFSET $${n + 1}`,
      params
    );
    // Distinct categories for filter
    const { rows: cats } = await pool.query(`SELECT DISTINCT category FROM youtube_videos WHERE is_published = TRUE AND category IS NOT NULL ORDER BY category`);
    res.json({ rows, total: countRes.rows[0].total, categories: cats.map((c) => c.category) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: list all videos (including unpublished)
websiteRouter.get('/admin/videos', requireAuth, requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, title, youtube_url, description, category, is_featured, is_published, sort_order, created_at, updated_at
       FROM youtube_videos ORDER BY sort_order ASC, created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: create video
websiteRouter.post('/admin/videos', requireAuth, requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { title, youtube_url, description, category, is_featured, is_published, sort_order } = req.body;
    if (!title || !youtube_url) return res.status(400).json({ error: 'Title and YouTube URL are required' });
    const { rows } = await pool.query(
      `INSERT INTO youtube_videos (title, youtube_url, description, category, is_featured, is_published, sort_order, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, youtube_url.trim(), description || null, category || 'general',
       is_featured === true || is_featured === 'true',
       is_published !== false && is_published !== 'false',
       parseInt(sort_order, 10) || 0, req.user.sub]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: update video
websiteRouter.patch('/admin/videos/:id', requireAuth, requireRole('merl', 'strategic_communications', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, youtube_url, description, category, is_featured, is_published, sort_order } = req.body;
    const { rows } = await pool.query(
      `UPDATE youtube_videos
       SET title = COALESCE($1, title),
           youtube_url = COALESCE($2, youtube_url),
           description = COALESCE($3, description),
           category = COALESCE($4, category),
           is_featured = COALESCE($5, is_featured),
           is_published = COALESCE($6, is_published),
           sort_order = COALESCE($7, sort_order),
           updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title || null, youtube_url ? youtube_url.trim() : null, description !== undefined ? description : null,
       category || null,
       is_featured !== undefined ? (is_featured === true || is_featured === 'true') : null,
       is_published !== undefined ? (is_published === true || is_published === 'true') : null,
       sort_order !== undefined ? (parseInt(sort_order, 10) || 0) : null,
       id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: delete video
websiteRouter.delete('/admin/videos/:id', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM youtube_videos WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
