import 'dotenv/config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrations = [
  // Epic 1: KMS — users, roles, documents, versions, access log
  `
  CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
  INSERT INTO roles (name) VALUES ('merl'), ('strategic_communications'), ('ict'), ('programme'), ('admin') ON CONFLICT (name) DO NOTHING;

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role_id INT REFERENCES roles(id),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS document_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
  );
  INSERT INTO document_types (name) VALUES ('report'), ('brief'), ('publication'), ('policy'), ('other') ON CONFLICT (name) DO NOTHING;

  CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    project TEXT,
    thematic_area TEXT,
    document_type_id INT REFERENCES document_types(id),
    uploaded_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS document_versions (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    file_path TEXT NOT NULL,
    uploaded_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, version_number)
  );

  CREATE TABLE IF NOT EXISTS document_access_log (
    id SERIAL PRIMARY KEY,
    document_id INT REFERENCES documents(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project);
  CREATE INDEX IF NOT EXISTS idx_documents_thematic ON documents(thematic_area);
  CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at);
  CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);
  CREATE INDEX IF NOT EXISTS idx_document_access_log_doc ON document_access_log(document_id);
  CREATE INDEX IF NOT EXISTS idx_document_access_log_created ON document_access_log(created_at);
  `,
  // Epic 2: Conflict & peace data
  `
  CREATE TABLE IF NOT EXISTS conflict_incidents (
    id SERIAL PRIMARY KEY,
    lga TEXT NOT NULL,
    title TEXT,
    description TEXT,
    incident_date DATE,
    intensity_level TEXT,
    triggers TEXT[],
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS peacebuilding_actors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    focus_areas TEXT[],
    lga TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_lga ON conflict_incidents(lga);
  CREATE INDEX IF NOT EXISTS idx_incidents_date ON conflict_incidents(incident_date);
  CREATE INDEX IF NOT EXISTS idx_actors_lga ON peacebuilding_actors(lga);
  `,
  // Epic 3: Website content (pages, news, events, newsletter)
  `
  CREATE TABLE IF NOT EXISTS content_pages (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_by INT REFERENCES users(id),
    updated_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS news_posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    body TEXT,
    status TEXT DEFAULT 'draft',
    published_at TIMESTAMPTZ,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    location TEXT,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    subscribed_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS content_approvals (
    id SERIAL PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id INT NOT NULL,
    requested_by INT REFERENCES users(id),
    approved_by INT REFERENCES users(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );
  `,
  // Epic 4: Applications
  `
  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    data JSONB NOT NULL,
    attachment_path TEXT,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_applications_type ON applications(type);
  CREATE INDEX IF NOT EXISTS idx_applications_created ON applications(created_at);
  `,
  // Epic 3: Publish from KMS to website; events published_at; contact messages
  `ALTER TABLE documents ADD COLUMN IF NOT EXISTS published_to_website BOOLEAN DEFAULT FALSE;
   ALTER TABLE events ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

   CREATE TABLE IF NOT EXISTS contact_messages (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT NOT NULL,
     subject TEXT,
     message TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at);`,
  // Epic 3: Photo galleries (Story 3.5)
  `
  CREATE TABLE IF NOT EXISTS galleries (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image_path TEXT,
    status TEXT DEFAULT 'draft',
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS gallery_items (
    id SERIAL PRIMARY KEY,
    gallery_id INT NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    caption TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_galleries_status ON galleries(status);
  CREATE INDEX IF NOT EXISTS idx_gallery_items_gallery ON gallery_items(gallery_id);
  `,
  `ALTER TABLE galleries ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;`,
  `ALTER TABLE news_posts ADD COLUMN IF NOT EXISTS featured_image_path TEXT;`,
  // Partners (for homepage and partners page)
  `
  CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT,
    category TEXT DEFAULT 'international',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_partners_category ON partners(category);
  `,
  // Expanded roles: add description column and new roles
  `
  ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  INSERT INTO roles (name, description) VALUES
    ('case_reporting', 'Can report and manage conflict cases'),
    ('viewer', 'Read-only access to dashboards and reports'),
    ('field_officer', 'Field data collection and incident reporting'),
    ('analyst', 'Data analysis and trend reporting')
  ON CONFLICT (name) DO NOTHING;
  UPDATE roles SET description = 'Monitoring, evaluation, research and learning' WHERE name = 'merl' AND description IS NULL;
  UPDATE roles SET description = 'Strategic communications and media' WHERE name = 'strategic_communications' AND description IS NULL;
  UPDATE roles SET description = 'Information and communications technology' WHERE name = 'ict' AND description IS NULL;
  UPDATE roles SET description = 'Programme design and implementation' WHERE name = 'programme' AND description IS NULL;
  UPDATE roles SET description = 'Full system administration' WHERE name = 'admin' AND description IS NULL;
  `,
  // Expanded conflict_incidents — detailed fields matching PSPBA conflict database
  `
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS incident_time TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS district TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS incident_type TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS actor TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS place_of_attack TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS deaths INT DEFAULT 0;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS injured INT DEFAULT 0;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS property_destroyed TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS idps INT DEFAULT 0;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS source TEXT;
  ALTER TABLE conflict_incidents ADD COLUMN IF NOT EXISTS observation TEXT;
  CREATE INDEX IF NOT EXISTS idx_incidents_type ON conflict_incidents(incident_type);
  CREATE INDEX IF NOT EXISTS idx_incidents_deaths ON conflict_incidents(deaths);
  `,
  // Partners: add logo_path column
  `ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_path TEXT;`,
  // Team members table
  `
  CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    title TEXT,
    department TEXT,
    category TEXT DEFAULT 'management',
    bio TEXT,
    photo_path TEXT,
    email TEXT,
    phone TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_team_category ON team_members(category);
  CREATE INDEX IF NOT EXISTS idx_team_active ON team_members(is_active);
  `,
  // Expand peacebuilding_actors to match PSPBA NGO directory
  `
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS year_established TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'Non-State Actor';
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS expertise TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS office_address TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS contact_name TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS contact_position TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS website TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS intervention_type TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS lgas_of_intervention TEXT[];
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS community_of_intervention TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS target_group TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS donors TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS observation TEXT;
  ALTER TABLE peacebuilding_actors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
  CREATE INDEX IF NOT EXISTS idx_actors_type ON peacebuilding_actors(actor_type);
  CREATE INDEX IF NOT EXISTS idx_actors_active ON peacebuilding_actors(is_active);
  `,
  // YouTube videos table
  `
  CREATE TABLE IF NOT EXISTS youtube_videos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_by INT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_yt_videos_published ON youtube_videos(is_published);
  CREATE INDEX IF NOT EXISTS idx_yt_videos_featured ON youtube_videos(is_featured);
  CREATE INDEX IF NOT EXISTS idx_yt_videos_category ON youtube_videos(category);
  `,
  // Departments (managed list for team members)
  `
  CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  INSERT INTO departments (name, sort_order) VALUES
    ('Executive', 0),
    ('Programme', 1),
    ('MERL', 2),
    ('Strategic Communications', 3),
    ('ICT', 4),
    ('Finance & Admin', 5)
  ON CONFLICT (name) DO NOTHING;
  `,
  // Ensure application IDs start at 1000 (4-digit)
  `SELECT setval('applications_id_seq', GREATEST((SELECT last_value FROM applications_id_seq), 999));`,
  // Translation cache for i18n
  `
  CREATE TABLE IF NOT EXISTS translation_cache (
    id SERIAL PRIMARY KEY,
    source_text_hash TEXT NOT NULL,
    source_lang TEXT NOT NULL DEFAULT 'en',
    target_lang TEXT NOT NULL,
    source_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_lookup
    ON translation_cache(source_text_hash, source_lang, target_lang);
  `,
  // Document access control: public/private + request table
  `
  ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'public';
  CREATE TABLE IF NOT EXISTS document_requests (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL REFERENCES documents(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
  CREATE INDEX IF NOT EXISTS idx_document_requests_doc ON document_requests(document_id);
  `,
];

async function run() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < migrations.length; i++) {
      await client.query(migrations[i]);
      console.log(`Migration ${i + 1}/${migrations.length} applied.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
