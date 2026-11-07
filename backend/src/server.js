import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

import { pool } from './db/index.js';
import { kmsRouter } from './routes/kms.js';
import { authRouter } from './routes/auth.js';
import { conflictRouter } from './routes/conflict.js';
import { websiteRouter } from './routes/website.js';
import { applicationsRouter } from './routes/applications.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

// Env validation (production)
if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    console.error('Fatal: DATABASE_URL is required in production.');
    process.exit(1);
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error('Fatal: JWT_SECRET must be set and at least 32 characters in production.');
    process.exit(1);
  }
}

const app = express();

// 301 redirect: old domain → pspba.org (Story 3.1; set OLD_DOMAIN in production)
const oldDomain = process.env.OLD_DOMAIN || '';
if (oldDomain) {
  app.use((req, res, next) => {
    if (req.hostname === oldDomain) {
      const target = `https://${process.env.NEW_DOMAIN || 'pspba.org'}${req.originalUrl}`;
      return res.redirect(301, target);
    }
    next();
  });
}

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());

// Ensure upload/backup dirs exist
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads');
const backupDir = process.env.LOCAL_BACKUP_DIR || join(__dirname, '..', 'backups');
await mkdir(uploadDir, { recursive: true });
await mkdir(backupDir, { recursive: true });

// Health (DB check optional)
app.get('/api/health', async (_, res) => {
  let db = 'pending';
  try { await pool.query('SELECT 1'); db = 'ok'; } catch (_) { db = 'error'; }
  res.json({ status: 'ok', db });
});

// Dashboard statistics (protected)
import { requireAuth } from './middleware/auth.js';
app.get('/api/dashboard/stats', requireAuth, async (_, res) => {
  try {
    const [users, docs, incidents, actors, news, events, pages, apps, messages, subscribers, galleries, videos] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
      pool.query('SELECT COUNT(*)::int AS count FROM documents'),
      pool.query('SELECT COUNT(*)::int AS count FROM conflict_incidents'),
      pool.query('SELECT COUNT(*)::int AS count FROM peacebuilding_actors'),
      pool.query("SELECT COUNT(*)::int AS count FROM news_posts WHERE status = 'published'"),
      pool.query("SELECT COUNT(*)::int AS count FROM events WHERE status = 'published'"),
      pool.query("SELECT COUNT(*)::int AS count FROM content_pages WHERE status = 'published'"),
      pool.query('SELECT COUNT(*)::int AS count FROM applications'),
      pool.query('SELECT COUNT(*)::int AS count FROM contact_messages'),
      pool.query('SELECT COUNT(*)::int AS count FROM newsletter_subscribers'),
      pool.query("SELECT COUNT(*)::int AS count FROM galleries WHERE status = 'published'"),
      pool.query("SELECT COUNT(*)::int AS count FROM youtube_videos WHERE is_published = TRUE"),
    ]);
    // Incidents by intensity
    const intensityRows = await pool.query(
      `SELECT intensity_level, COUNT(*)::int AS count FROM conflict_incidents WHERE intensity_level IS NOT NULL GROUP BY intensity_level`
    );
    // Incidents by LGA (top 10)
    const lgaRows = await pool.query(
      `SELECT lga, COUNT(*)::int AS count FROM conflict_incidents GROUP BY lga ORDER BY count DESC LIMIT 10`
    );
    // Recent incidents
    const recentIncidents = await pool.query(
      `SELECT id, lga, title, intensity_level, incident_date FROM conflict_incidents ORDER BY incident_date DESC NULLS LAST LIMIT 5`
    );
    // Users by role
    const roleRows = await pool.query(
      `SELECT r.name AS role, COUNT(u.id)::int AS count FROM roles r LEFT JOIN users u ON u.role_id = r.id GROUP BY r.name ORDER BY count DESC`
    );
    res.json({
      users: users.rows[0].count,
      documents: docs.rows[0].count,
      incidents: incidents.rows[0].count,
      actors: actors.rows[0].count,
      newsPublished: news.rows[0].count,
      eventsPublished: events.rows[0].count,
      pagesPublished: pages.rows[0].count,
      applications: apps.rows[0].count,
      contactMessages: messages.rows[0].count,
      newsletterSubscribers: subscribers.rows[0].count,
      galleries: galleries.rows[0].count,
      videos: videos.rows[0].count,
      incidentsByIntensity: Object.fromEntries(intensityRows.rows.map((r) => [r.intensity_level, r.count])),
      incidentsByLga: lgaRows.rows,
      recentIncidents: recentIncidents.rows,
      usersByRole: roleRows.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/kms', kmsRouter);
app.use('/api/conflict', conflictRouter);
app.use('/api/website', websiteRouter);
app.use('/api/applications', applicationsRouter);

app.post('/api/translate', async (req, res) => {
  try {
    const { texts, targetLang } = req.body;
    if (!texts || !targetLang || targetLang === 'en') return res.json({ translations: texts });

    const results = new Array(texts.length);
    const uncached = [];

    for (let i = 0; i < texts.length; i++) {
      const hash = crypto.createHash('sha256').update(texts[i]).digest('hex');
      const cached = await pool.query(
        'SELECT translated_text FROM translation_cache WHERE source_text_hash = $1 AND target_lang = $2',
        [hash, targetLang]
      );
      if (cached.rows.length > 0) {
        results[i] = cached.rows[0].translated_text;
      } else {
        uncached.push({ index: i, text: texts[i], hash });
      }
    }

    for (const item of uncached) {
      try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(item.text.slice(0, 500))}&langpair=en|${targetLang}`;
        const r = await fetch(url);
        const data = await r.json();
        const translated = data?.responseData?.translatedText || item.text;
        results[item.index] = translated;
        await pool.query(
          'INSERT INTO translation_cache (source_text_hash, source_lang, target_lang, source_text, translated_text) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (source_text_hash, source_lang, target_lang) DO UPDATE SET translated_text = $5',
          [item.hash, 'en', targetLang, item.text, translated]
        );
      } catch {
        results[item.index] = item.text;
      }
    }

    res.json({ translations: results });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
}

export { app };
