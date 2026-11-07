#!/usr/bin/env node
/**
 * Seed demo/dummy data for design preview.
 * Run after: npm run db:migrate, then curl -X POST .../api/auth/seed
 * Usage: node backend/scripts/seed-demo.js
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../src/db/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const uploadDir = process.env.UPLOAD_DIR || join(__dirname, '..', 'uploads');
const PLACEHOLDER = 'https://picsum.photos/seed/pspba';
const lgas = ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'];

async function seed() {
  const client = await pool.connect();
  try {
    const { rows: users } = await client.query('SELECT id FROM users LIMIT 1');
    const userId = users[0]?.id || 1;

    const { rows: roles } = await client.query("SELECT id FROM roles WHERE name = 'admin'");
    const roleId = roles[0]?.id || 1;

    // Content pages
    const aboutBody = `<p>The Plateau State Peacebuilding Agency (PSPBA) was established to coordinate peacebuilding efforts across Plateau State. We work with communities, government, and partners to strengthen peace and resilience.</p>
<p><a href="/page/our-work">Learn about our work</a> across the 17 LGAs.</p>
<p><strong>Our vision:</strong> A peaceful, united Plateau State where all citizens live in harmony.</p>
<p><strong>Our mission:</strong> To facilitate and coordinate peacebuilding initiatives that address root causes of conflict and promote sustainable peace.</p>
<h3>Key Focus Areas</h3>
<ul><li>Conflict prevention and early warning</li><li>Dialogue and mediation</li><li>Community reconciliation</li><li>Youth and women in peacebuilding</li><li>Evidence-based programming</li></ul>`;
    const workBody = `<p>PSPBA implements programmes across all 17 Local Government Areas of Plateau State. Our work includes:</p>
<ul><li><strong>Community Dialogue:</strong> Facilitating inter-communal dialogues to build trust</li>
<li><strong>Capacity Building:</strong> Training peace actors and local leaders</li>
<li><strong>Research:</strong> Conflict analysis and trend monitoring</li>
<li><strong>Coordination:</strong> Partnering with government and civil society</li></ul>`;
    await client.query(`INSERT INTO content_pages (slug, title, body, status, created_by, updated_by, published_at)
      VALUES ('about', 'About PSPBA', $1, 'published', $2, $2, NOW()), ('our-work', 'Our Work', $3, 'published', $2, $2, NOW())
      ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, status = 'published', updated_at = NOW()`, [aboutBody, userId, workBody]);

    // Additional content pages (team, partners, etc.)
    const contentPages = [
      ['team', 'Our Team', '<p>PSPBA is led by a dedicated team of professionals committed to peacebuilding across Plateau State.</p><h3>Management</h3><p>Our management team provides strategic direction and oversight.</p><h3>Directorate</h3><p>The Directorate comprises Director General, Administration, Programme, Finance, and Internal Audit.</p><h3>Units</h3><p>Gender & Youth, ICT, Inter Faith, Monitoring & Evaluation, Mediation & Dialogue, Peace Education, Research & Coordination, Security, Strategic Communication.</p>'],
      ['director-general', 'Director General', '<p>The Office of the Director General provides overall leadership for PSPBA. Dr. Julie G. Sanda leads the agency in its mission to strengthen peace and resilience.</p>'],
      ['administration', 'Administration', '<p>The Administration unit handles human resources, logistics, and day-to-day operations.</p>'],
      ['programme', 'Programme', '<p>The Programme unit designs and implements peacebuilding initiatives across the 17 LGAs.</p>'],
      ['finance', 'Finance', '<p>The Finance unit manages budgeting, grants, and financial reporting.</p>'],
      ['internal-audit', 'Internal Audit', '<p>Internal Audit ensures transparency and accountability in PSPBA operations.</p>'],
      ['unit-gender-youth', 'Gender & Youth Unit', '<p>This unit promotes the inclusion of women and youth in peacebuilding processes.</p>'],
      ['unit-ict', 'ICT Unit', '<p>The ICT unit supports digital systems, data management, and communications.</p>'],
      ['unit-inter-faith', 'Inter Faith Unit', '<p>Building bridges across religious communities for peace and coexistence.</p>'],
      ['unit-me', 'Monitoring & Evaluation', '<p>M&E tracks programme impact and supports evidence-based learning.</p>'],
      ['unit-mediation', 'Mediation & Dialogue', '<p>Facilitating dialogue and mediation to resolve conflicts at community level.</p>'],
      ['unit-peace-education', 'Peace Education', '<p>Delivering peace education programmes in schools and communities.</p>'],
      ['unit-research', 'Research & Coordination', '<p>Conflict research and coordination with partners and stakeholders.</p>'],
      ['unit-security', 'Security Unit', '<p>Coordinating with security agencies on peace and security matters.</p>'],
      ['unit-strategic-comms', 'Strategic Communication', '<p>Communicating PSPBA’s work and fostering public awareness.</p>'],
      ['partners-international', 'International Partners', '<p>PSPBA works with GIZ, HD, Mercy Corps, SFCG, TEARFUND, UNDP, USIP, USAID/NERI, UN Women, US Embassy, NRC and others.</p><p><a href="/partners">View full partners list</a></p>'],
      ['partners-local', 'Local Partners', '<p>We collaborate with Plateau State Government, community-based organizations, traditional rulers, and local NGOs.</p><p><a href="/partners">View full partners list</a></p>'],
      ['donation', 'Support Our Work', '<p>PSPBA welcomes support from individuals and organizations committed to peace.</p><p>For donation inquiries, please <a href="/contact">contact us</a>.</p>'],
      ['report-incident', 'Report an Incident', '<p>To report a conflict incident for our early warning system, please <a href="/contact">contact us</a> or visit your nearest LGA office.</p>'],
      ['youtube', 'PSPBA on YouTube', '<p>Watch our videos and documentaries on peacebuilding in Plateau State.</p><p>Channel coming soon.</p>'],
      ['hausa', 'Bayanan Hausa', '<p>Za mu iya samun sakin layi na Hausa nan gaba. Haifa version coming soon.</p>'],
      ['register-org-form', 'Register Your Organization', '<p>Peacebuilding organizations can register with PSPBA to coordinate and collaborate.</p><p><a href="/contact">Contact us</a> to request the registration form.</p>'],
    ];
    for (const [slug, title, body] of contentPages) {
      await client.query(
        `INSERT INTO content_pages (slug, title, body, status, created_by, updated_by, published_at)
         VALUES ($1, $2, $3, 'published', $4, $4, NOW())
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, status = 'published', updated_at = NOW()`,
        [slug, title, body, userId]
      );
    }

    // News posts
    const news = [
      { title: 'SPRiNG Programme Launches Community Dialogue Series', slug: 'spring-dialogue-launch', excerpt: 'A new series of community dialogues kicks off across five LGAs to foster inter-communal understanding.', body: '<p>Placeholder content for the SPRiNG dialogue launch article. PSPBA continues to expand its dialogue programmes across Plateau State.</p>' },
      { title: 'PSPBA Hosts Peacebuilding Workshop for Youth Leaders', slug: 'youth-workshop-2025', excerpt: 'Over 50 youth leaders from across Plateau State participated in a three-day peacebuilding workshop.', body: '<p>Placeholder content for the youth workshop. Participants gained skills in mediation and conflict resolution.</p>' },
      { title: 'Quarterly Conflict Trends Report Released', slug: 'q4-conflict-trends', excerpt: 'The latest report highlights improvements in Barkin Ladi and ongoing challenges in Riyom.', body: '<p>Placeholder content for the conflict trends report. Data shows positive trends in several LGAs.</p>' },
      { title: 'Partnership MOU Signed with UN Women', slug: 'un-women-partnership', excerpt: 'PSPBA and UN Women agree to collaborate on women-led peacebuilding initiatives.', body: '<p>Placeholder content. This partnership will strengthen gender-responsive peacebuilding across the state.</p>' },
      { title: 'CPAF Barkin Ladi Meets to Address Festive Period Security', slug: 'cpaf-barkin-ladi-2025', excerpt: 'Community Peace Architecture Forum convenes to plan for peace during the festive period and beyond.', body: '<p>Placeholder content. Stakeholders discussed early warning and community engagement strategies.</p>' },
      { title: 'PSPBA Hosts Plateau Peace Architecture Forum for November 2025', slug: 'ppaf-november-2025', excerpt: 'Monthly PPAF meeting brings together key peace actors to coordinate responses.', body: '<p>Placeholder content. The forum reviewed progress and planned upcoming activities.</p>' },
    ];
    for (const n of news) {
      await client.query(
        `INSERT INTO news_posts (title, slug, excerpt, body, status, created_by, published_at)
         VALUES ($1, $2, $3, $4, 'published', $5, NOW())
         ON CONFLICT (slug) DO NOTHING`,
        [n.title, n.slug, n.excerpt, n.body, userId]
      );
    }

    // Events
    const now = new Date();
    const events = [
      { title: 'Community Dialogue – Bassa LGA', desc: 'Inter-communal dialogue session', start: new Date(now.getTime() + 7 * 86400000), end: null, loc: 'Bassa' },
      { title: 'Youth Peace Camp', desc: 'Three-day residential camp for young peacebuilders', start: new Date(now.getTime() + 14 * 86400000), end: new Date(now.getTime() + 17 * 86400000), loc: 'Jos' },
      { title: 'Stakeholder Roundtable on Early Warning', desc: 'Discussion on strengthening early warning systems', start: new Date(now.getTime() + 21 * 86400000), end: null, loc: 'Rayfield, Jos' },
      { title: 'CPAF Riyom Monthly Meeting', desc: 'Community Peace Architecture Forum meets to discuss local peace initiatives', start: new Date(now.getTime() + 10 * 86400000), end: null, loc: 'Riyom' },
      { title: 'PPAF October 2025', desc: 'Plateau Peace Architecture Forum monthly coordination', start: new Date(now.getTime() - 15 * 86400000), end: null, loc: 'Jos' },
      { title: 'Training of Trainers – Mediation', desc: 'ToT for local mediators', start: new Date(now.getTime() - 5 * 86400000), end: null, loc: 'Jos' },
    ];
    for (const e of events) {
      await client.query(
        `INSERT INTO events (title, description, start_at, end_at, location, status, published_at)
         VALUES ($1, $2, $3, $4, $5, 'published', NOW())`,
        [e.title, e.desc, e.start, e.end, e.loc]
      );
    }

    // Galleries with placeholder images (external URLs)
    const covers = [`${PLACEHOLDER}1/800/600`, `${PLACEHOLDER}2/800/600`, `${PLACEHOLDER}3/800/600`];
    const galleryData = [
      ['Community Dialogue Sessions', 'community-dialogue-2025', 'Photos from dialogue sessions across Plateau State', covers[0]],
      ['Youth Peace Camp 2025', 'youth-peace-camp', 'Young leaders at the annual peace camp', covers[1]],
      ['Field Visits and Engagement', 'field-visits', 'PSPBA staff engaging with communities', covers[2]],
    ];
    for (const [title, slug, desc, cover] of galleryData) {
      await client.query(
        `INSERT INTO galleries (title, slug, description, cover_image_path, status, created_by, published_at)
         VALUES ($1, $2, $3, $4, 'published', $5, NOW())
         ON CONFLICT (slug) DO UPDATE SET cover_image_path = EXCLUDED.cover_image_path, title = EXCLUDED.title, description = EXCLUDED.description`,
        [title, slug, desc, cover, userId]
      );
    }
    const { rows: galleries } = await client.query('SELECT id, slug FROM galleries WHERE status = $1', ['published']);

    const existingItems = await client.query('SELECT gallery_id FROM gallery_items LIMIT 1');
    if (existingItems.rows.length === 0) {
      for (const g of galleries || []) {
        const imgs = [`${PLACEHOLDER}${g.id}a/800/600`, `${PLACEHOLDER}${g.id}b/800/600`, `${PLACEHOLDER}${g.id}c/800/600`];
        for (let i = 0; i < imgs.length; i++) {
          await client.query(
            'INSERT INTO gallery_items (gallery_id, file_path, caption, sort_order) VALUES ($1, $2, $3, $4)',
            [g.id, imgs[i], `Image ${i + 1}`, i]
          );
        }
      }
    }

    // Conflict incidents
    for (let i = 0; i < 8; i++) {
      await client.query(
        `INSERT INTO conflict_incidents (lga, title, description, incident_date, intensity_level, triggers, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [lgas[i % lgas.length], `Sample incident ${i + 1}`, 'Placeholder description for conflict incident.', new Date(now.getTime() - (i * 30 + 10) * 86400000), ['low', 'medium', 'high'][i % 3], ['land', 'cattle', 'political'][i % 3] ? [['land', 'cattle', 'political'][i % 3]] : null, userId]
      );
    }

    // Peacebuilding actors
    const actors = [
      { name: 'Plateau Youth Council', email: 'contact@pyc.org', phone: '08012345678', focus: ['youth', 'dialogue'], lga: 'Jos North' },
      { name: 'Women in Peace Network', email: 'info@wipn.org', phone: '08023456789', focus: ['women', 'reconciliation'], lga: 'Bassa' },
      { name: 'Traditional Council Barkin Ladi', email: 'tcbl@example.org', phone: null, focus: ['traditional', 'mediation'], lga: 'Barkin Ladi' },
      { name: 'CBO Riyom', email: 'cbo.riyom@example.org', phone: '08034567890', focus: ['community', 'early warning'], lga: 'Riyom' },
    ];
    for (const a of actors) {
      await client.query(
        'INSERT INTO peacebuilding_actors (name, contact_email, contact_phone, focus_areas, lga) VALUES ($1, $2, $3, $4, $5)',
        [a.name, a.email, a.phone, a.focus, a.lga]
      );
    }

    // Newsletter subscribers
    for (const e of ['subscriber1@example.org', 'subscriber2@example.org', 'partner@ngo.org']) {
      await client.query('INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING', [e]);
    }

    // Documents (repository) — create placeholder files and publish to website
    const docCheck = await client.query('SELECT 1 FROM documents WHERE published_to_website = true LIMIT 1');
    if (docCheck.rows.length === 0) {
      mkdirSync(uploadDir, { recursive: true });
      const { rows: dt } = await client.query("SELECT id, name FROM document_types WHERE name IN ('report', 'brief', 'publication', 'policy') ORDER BY name");
      const docTypes = Object.fromEntries(dt.map((r) => [r.name, r.id]));
      const docs = [
        ['Plateau State Roadmap to Peace', 'plateau-roadmap-to-peace.pdf', 'report', 'SPRiNG', 'Peacebuilding'],
        ['PSPBA Organizational Chart', 'pspba-org-chart.pdf', 'publication', null, null],
        ['Quarterly Conflict Trends Q4 2024', 'q4-conflict-trends-2024.pdf', 'report', 'Conflict Analysis', 'Research'],
        ['Community Dialogue Best Practices', 'dialogue-best-practices.pdf', 'brief', 'Dialogue', 'Peace Education'],
      ];
      for (const [title, fileName, typeName, project, thematic] of docs) {
        const placeholderPath = `seed-doc-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`;
        const fullPath = join(uploadDir, placeholderPath);
        writeFileSync(fullPath, `PSPBA placeholder document: ${title}\n\nThis is demo content for design preview.`, 'utf8');
        const typeId = docTypes[typeName] || docTypes.report;
        const { rows: ins } = await client.query(
          `INSERT INTO documents (title, file_name, file_path, file_size, mime_type, project, thematic_area, document_type_id, uploaded_by)
           VALUES ($1, $2, $3, $4, 'text/plain', $5, $6, $7, $8) RETURNING id`,
          [title, fileName, placeholderPath, 100, project, thematic, typeId, userId]
        );
        await client.query('UPDATE documents SET published_to_website = true WHERE id = $1', [ins[0].id]);
      }
    }

    // Contact messages (for admin)
    const msgCheck = await client.query('SELECT 1 FROM contact_messages LIMIT 1');
    if (msgCheck.rows.length === 0) {
      const messages = [
        ['John Doe', 'john@example.org', 'Partnership inquiry', 'We would like to explore collaboration with PSPBA on community dialogue.'],
        ['Mary Okonkwo', 'mary@ngo.org', 'Volunteer opportunity', 'I am interested in volunteering. Please share more details.'],
        ['Rev. David', 'david@church.org', 'Inter-faith dialogue', 'Our inter-faith council would like to participate in your programmes.'],
      ];
      for (const [name, email, subject, message] of messages) {
        await client.query('INSERT INTO contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4)', [name, email, subject, message]);
      }
    }

    // Sample applications (for status lookup demo)
    const appCheck = await client.query('SELECT 1 FROM applications LIMIT 1');
    if (appCheck.rows.length === 0) {
      const apps = [
        ['volunteer', 'Amina Yusuf', 'amina@example.org', '08011112222', { area_of_interest: 'Community dialogue', motivation: 'I want to contribute to peace.' }],
        ['intern', 'Ibrahim Musa', 'ibrahim@university.edu', '08022223333', { institution: 'University of Jos', preferred_department: 'Research' }],
        ['consultant', 'Dr. Grace Okon', 'grace@consulting.org', null, { expertise_area: 'Conflict analysis and research' }],
      ];
      for (const [type, name, email, phone, data] of apps) {
        const { rows: r } = await client.query(
          'INSERT INTO applications (type, name, email, phone, data) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [type, name, email, phone, JSON.stringify(data)]
        );
        console.log(`  Sample application: ID ${r[0].id} — ${name} (${type}), check at /application-status with this ID and ${email}`);
      }
    }

    // Partners (from PSPBA website)
    const partnerCheck = await client.query('SELECT 1 FROM partners LIMIT 1');
    if (partnerCheck.rows.length === 0) {
      const partners = [
        ['GIZ', 'https://www.giz.de/', 'international', 1],
        ['HD', 'https://www.hdcentre.org/', 'international', 2],
        ['Mercy Corps', 'https://www.mercycorps.org/', 'international', 3],
        ['SFCG', 'https://www.sfcg.org/', 'international', 4],
        ['TEARFUND', 'https://www.tearfund.org/', 'international', 5],
        ['UNDP', 'https://www.undp.org/', 'international', 6],
        ['USIP', 'https://www.usip.org/', 'international', 7],
        ['USAID/NERI', null, 'international', 8],
        ['UN Women', 'https://www.unwomen.org/', 'international', 9],
        ['US Embassy', null, 'international', 10],
        ['NRC', 'https://www.nrc.no/', 'international', 11],
        ['Plateau State Government', null, 'local', 1],
        ['Community Based Organizations', null, 'local', 2],
        ['Traditional Rulers Council', null, 'local', 3],
      ];
      for (const [name, url, category, sortOrder] of partners) {
        await client.query('INSERT INTO partners (name, url, category, sort_order) VALUES ($1, $2, $3, $4)', [name, url, category, sortOrder]);
      }
    }

    console.log('Demo data seeded successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((e) => { console.error(e); process.exit(1); });
