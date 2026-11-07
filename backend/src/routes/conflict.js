import { Router } from 'express';
import { pool } from '../db/index.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { PLATEAU_LGAS } from '../constants/lgas.js';

export const conflictRouter = Router();

// Public: LGAs list and map data (for public website map)
conflictRouter.get('/lgas', (_, res) => res.json(PLATEAU_LGAS));

conflictRouter.get('/map-data', async (req, res) => {
  try {
    const [incidents, actors] = await Promise.all([
      pool.query(
        `SELECT lga, intensity_level, COUNT(*) AS count, MAX(incident_date) AS latest
         FROM conflict_incidents GROUP BY lga, intensity_level`
      ),
      pool.query(
        `SELECT lga, COUNT(*) AS count FROM peacebuilding_actors WHERE lga IS NOT NULL GROUP BY lga`
      ),
    ]);
    const byLga = {};
    PLATEAU_LGAS.forEach((lga) => {
      byLga[lga] = { incidents: [], actorsCount: 0 };
    });
    incidents.rows.forEach((r) => {
      if (byLga[r.lga]) byLga[r.lga].incidents.push({ intensity: r.intensity_level, count: parseInt(r.count, 10), latest: r.latest });
    });
    actors.rows.forEach((r) => {
      if (byLga[r.lga]) byLga[r.lga].actorsCount = parseInt(r.count, 10);
    });
    res.json(byLga);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Public: conflict data page (stats + paginated list) ———
conflictRouter.get('/public-stats', async (req, res) => {
  try {
    const [total, deaths, injured, idps, byLga, byType, byMonth] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM conflict_incidents'),
      pool.query('SELECT COALESCE(SUM(deaths),0)::int AS total FROM conflict_incidents'),
      pool.query('SELECT COALESCE(SUM(injured),0)::int AS total FROM conflict_incidents'),
      pool.query('SELECT COALESCE(SUM(idps),0)::int AS total FROM conflict_incidents'),
      pool.query('SELECT lga, COUNT(*)::int AS count, COALESCE(SUM(deaths),0)::int AS deaths FROM conflict_incidents GROUP BY lga ORDER BY count DESC'),
      pool.query("SELECT COALESCE(incident_type, 'Unknown') AS type, COUNT(*)::int AS count FROM conflict_incidents GROUP BY incident_type ORDER BY count DESC"),
      pool.query(`SELECT to_char(incident_date, 'YYYY-MM') AS month, COUNT(*)::int AS count, COALESCE(SUM(deaths),0)::int AS deaths
         FROM conflict_incidents WHERE incident_date IS NOT NULL GROUP BY month ORDER BY month DESC LIMIT 24`),
    ]);
    res.json({
      totalIncidents: total.rows[0].count,
      totalDeaths: deaths.rows[0].total,
      totalInjured: injured.rows[0].total,
      totalIdps: idps.rows[0].total,
      byLga: byLga.rows,
      byType: byType.rows,
      byMonth: byMonth.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

conflictRouter.get('/public-list', async (req, res) => {
  try {
    const { lga, type, from, to, search, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT id, lga, district, title, incident_date, incident_time, incident_type, actor,
               place_of_attack, triggers, deaths, injured, property_destroyed, idps, source, observation,
               intensity_level FROM conflict_incidents WHERE 1=1`;
    const params = [];
    let n = 1;
    if (lga) { sql += ` AND lga = $${n}`; params.push(lga); n++; }
    if (type) { sql += ` AND incident_type = $${n}`; params.push(type); n++; }
    if (from) { sql += ` AND incident_date >= $${n}`; params.push(from); n++; }
    if (to) { sql += ` AND incident_date <= $${n}`; params.push(to); n++; }
    if (search) {
      sql += ` AND (title ILIKE $${n} OR place_of_attack ILIKE $${n} OR observation ILIKE $${n} OR lga ILIKE $${n})`;
      params.push(`%${search}%`); n++;
    }
    sql += ` ORDER BY incident_date DESC NULLS LAST, id DESC LIMIT $${n} OFFSET $${n+1}`;
    params.push(Math.min(parseInt(limit, 10) || 50, 200), parseInt(offset, 10) || 0);
    const { rows } = await pool.query(sql, params);
    // total count for pagination
    let countSql = `SELECT COUNT(*)::int AS total FROM conflict_incidents WHERE 1=1`;
    const countParams = [];
    let cn = 1;
    if (lga) { countSql += ` AND lga = $${cn}`; countParams.push(lga); cn++; }
    if (type) { countSql += ` AND incident_type = $${cn}`; countParams.push(type); cn++; }
    if (from) { countSql += ` AND incident_date >= $${cn}`; countParams.push(from); cn++; }
    if (to) { countSql += ` AND incident_date <= $${cn}`; countParams.push(to); cn++; }
    if (search) { countSql += ` AND (title ILIKE $${cn} OR place_of_attack ILIKE $${cn} OR observation ILIKE $${cn} OR lga ILIKE $${cn})`; countParams.push(`%${search}%`); cn++; }
    const { rows: countRows } = await pool.query(countSql, countParams);
    res.json({ rows, total: countRows[0].total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ——— Public: Peacebuilding Actors directory ———
conflictRouter.get('/public-actors', async (req, res) => {
  try {
    const { search, lga, type, limit = 50, offset = 0 } = req.query;
    let sql = `SELECT id, name, year_established, actor_type, expertise, office_address,
               contact_name, contact_position, contact_email, contact_phone, website,
               focus_areas, lga, lgas_of_intervention, intervention_type,
               community_of_intervention, target_group, donors, observation
               FROM peacebuilding_actors WHERE is_active IS NOT FALSE`;
    const params = [];
    let n = 1;
    if (search) {
      sql += ` AND (name ILIKE $${n} OR expertise ILIKE $${n} OR contact_name ILIKE $${n} OR office_address ILIKE $${n} OR intervention_type ILIKE $${n})`;
      params.push(`%${search}%`); n++;
    }
    if (lga) { sql += ` AND (lga = $${n} OR $${n} = ANY(lgas_of_intervention))`; params.push(lga); n++; }
    if (type) { sql += ` AND actor_type = $${n}`; params.push(type); n++; }
    sql += ` ORDER BY name ASC LIMIT $${n} OFFSET $${n+1}`;
    params.push(Math.min(parseInt(limit, 10) || 50, 200), parseInt(offset, 10) || 0);
    const { rows } = await pool.query(sql, params);

    // Count
    let countSql = `SELECT COUNT(*)::int AS total FROM peacebuilding_actors WHERE is_active IS NOT FALSE`;
    const cp = []; let cn = 1;
    if (search) { countSql += ` AND (name ILIKE $${cn} OR expertise ILIKE $${cn} OR contact_name ILIKE $${cn} OR office_address ILIKE $${cn} OR intervention_type ILIKE $${cn})`; cp.push(`%${search}%`); cn++; }
    if (lga) { countSql += ` AND (lga = $${cn} OR $${cn} = ANY(lgas_of_intervention))`; cp.push(lga); cn++; }
    if (type) { countSql += ` AND actor_type = $${cn}`; cp.push(type); cn++; }
    const { rows: countRows } = await pool.query(countSql, cp);

    // Distinct actor types for filter
    const { rows: types } = await pool.query(`SELECT DISTINCT actor_type FROM peacebuilding_actors WHERE actor_type IS NOT NULL ORDER BY actor_type`);

    res.json({ rows, total: countRows[0].total, actorTypes: types.map(t => t.actor_type) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Protected routes
conflictRouter.use(requireAuth);

// ——— Conflict incidents (Story 2.1) ———
conflictRouter.get('/incidents', async (req, res) => {
  try {
    const { lga, from, to, intensity } = req.query;
    let sql = `SELECT c.*, u.full_name AS created_by_name FROM conflict_incidents c LEFT JOIN users u ON c.created_by = u.id WHERE 1=1`;
    const params = [];
    let n = 1;
    if (lga) { sql += ` AND c.lga = $${n}`; params.push(lga); n++; }
    if (from) { sql += ` AND c.incident_date >= $${n}`; params.push(from); n++; }
    if (to) { sql += ` AND c.incident_date <= $${n}`; params.push(to); n++; }
    if (intensity) { sql += ` AND c.intensity_level = $${n}`; params.push(intensity); n++; }
    sql += ` ORDER BY c.incident_date DESC NULLS LAST, c.created_at DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.get('/incidents/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.full_name AS created_by_name FROM conflict_incidents c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.post('/incidents', requireRole('merl', 'programme', 'admin', 'case_reporting', 'field_officer'), async (req, res) => {
  try {
    const { lga, title, description, incident_date, incident_time, intensity_level, triggers,
            district, incident_type, actor, place_of_attack, deaths, injured, property_destroyed, idps, source, observation } = req.body;
    if (!lga) return res.status(400).json({ error: 'lga required' });
    const { rows } = await pool.query(
      `INSERT INTO conflict_incidents (lga, title, description, incident_date, incident_time, intensity_level, triggers, created_by,
       district, incident_type, actor, place_of_attack, deaths, injured, property_destroyed, idps, source, observation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       RETURNING *`,
      [
        lga, title || null, description || null, incident_date || null, incident_time || null,
        intensity_level || null,
        Array.isArray(triggers) ? triggers : (triggers ? [triggers] : null),
        req.user.sub,
        district || null, incident_type || null, actor || null, place_of_attack || null,
        parseInt(deaths, 10) || 0, parseInt(injured, 10) || 0, property_destroyed || null,
        parseInt(idps, 10) || 0, source || null, observation || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.patch('/incidents/:id', requireRole('merl', 'programme', 'admin', 'case_reporting', 'field_officer'), async (req, res) => {
  try {
    const { id } = req.params;
    const { lga, title, description, incident_date, incident_time, intensity_level, triggers,
            district, incident_type, actor, place_of_attack, deaths, injured, property_destroyed, idps, source, observation } = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    const addField = (col, val) => { if (val !== undefined) { updates.push(`${col} = $${n}`); params.push(val); n++; } };
    addField('lga', lga); addField('title', title); addField('description', description);
    addField('incident_date', incident_date); addField('incident_time', incident_time);
    addField('intensity_level', intensity_level);
    if (triggers !== undefined) { updates.push(`triggers = $${n}`); params.push(Array.isArray(triggers) ? triggers : [triggers]); n++; }
    addField('district', district); addField('incident_type', incident_type); addField('actor', actor);
    addField('place_of_attack', place_of_attack);
    if (deaths !== undefined) { updates.push(`deaths = $${n}`); params.push(parseInt(deaths, 10) || 0); n++; }
    if (injured !== undefined) { updates.push(`injured = $${n}`); params.push(parseInt(injured, 10) || 0); n++; }
    addField('property_destroyed', property_destroyed);
    if (idps !== undefined) { updates.push(`idps = $${n}`); params.push(parseInt(idps, 10) || 0); n++; }
    addField('source', source); addField('observation', observation);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE conflict_incidents SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.delete('/incidents/:id', requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM conflict_incidents WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Peacebuilding actors (Story 2.2) ———
conflictRouter.get('/actors', async (req, res) => {
  try {
    const { lga } = req.query;
    let sql = 'SELECT * FROM peacebuilding_actors WHERE 1=1';
    const params = [];
    if (lga) { sql += ' AND lga = $1'; params.push(lga); }
    sql += ' ORDER BY name';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.get('/actors/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM peacebuilding_actors WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.post('/actors', requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { name, contact_email, contact_phone, focus_areas, lga,
            year_established, actor_type, expertise, office_address, contact_name, contact_position,
            website, intervention_type, lgas_of_intervention, community_of_intervention, target_group, donors, observation, is_active } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { rows } = await pool.query(
      `INSERT INTO peacebuilding_actors (name, contact_email, contact_phone, focus_areas, lga,
       year_established, actor_type, expertise, office_address, contact_name, contact_position,
       website, intervention_type, lgas_of_intervention, community_of_intervention, target_group, donors, observation, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
      [
        name,
        contact_email || null, contact_phone || null,
        Array.isArray(focus_areas) ? focus_areas : (focus_areas ? [focus_areas] : null),
        lga || null,
        year_established || null, actor_type || 'Non-State Actor', expertise || null, office_address || null,
        contact_name || null, contact_position || null, website || null, intervention_type || null,
        Array.isArray(lgas_of_intervention) ? lgas_of_intervention : (lgas_of_intervention ? [lgas_of_intervention] : null),
        community_of_intervention || null, target_group || null, donors || null, observation || null,
        is_active !== false,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.patch('/actors/:id', requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const updates = [];
    const params = [];
    let n = 1;
    const addField = (col, val) => { if (val !== undefined) { updates.push(`${col} = $${n}`); params.push(val); n++; } };
    addField('name', fields.name); addField('contact_email', fields.contact_email);
    addField('contact_phone', fields.contact_phone); addField('lga', fields.lga);
    addField('year_established', fields.year_established); addField('actor_type', fields.actor_type);
    addField('expertise', fields.expertise); addField('office_address', fields.office_address);
    addField('contact_name', fields.contact_name); addField('contact_position', fields.contact_position);
    addField('website', fields.website); addField('intervention_type', fields.intervention_type);
    addField('community_of_intervention', fields.community_of_intervention);
    addField('target_group', fields.target_group); addField('donors', fields.donors);
    addField('observation', fields.observation);
    if (fields.focus_areas !== undefined) { updates.push(`focus_areas = $${n}`); params.push(Array.isArray(fields.focus_areas) ? fields.focus_areas : [fields.focus_areas]); n++; }
    if (fields.lgas_of_intervention !== undefined) { updates.push(`lgas_of_intervention = $${n}`); params.push(Array.isArray(fields.lgas_of_intervention) ? fields.lgas_of_intervention : [fields.lgas_of_intervention]); n++; }
    if (fields.is_active !== undefined) { updates.push(`is_active = $${n}`); params.push(!!fields.is_active); n++; }
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
    updates.push(`updated_at = NOW()`);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE peacebuilding_actors SET ${updates.join(', ')} WHERE id = $${n} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

conflictRouter.delete('/actors/:id', requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM peacebuilding_actors WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ——— Trend analysis (Story 2.4) ———
conflictRouter.get('/trends', requireRole('merl', 'programme', 'admin'), async (req, res) => {
  try {
    const { from, to } = req.query;
    let where = '1=1';
    const params = [];
    let n = 1;
    if (from) { where += ` AND incident_date >= $${n}`; params.push(from); n++; }
    if (to) { where += ` AND incident_date <= $${n}`; params.push(to); n++; }
    const [byLga, byIntensity, triggers] = await Promise.all([
      pool.query(`SELECT lga, COUNT(*) AS count FROM conflict_incidents WHERE ${where} GROUP BY lga ORDER BY count DESC`, params),
      pool.query(`SELECT intensity_level, COUNT(*) AS count FROM conflict_incidents WHERE ${where} AND intensity_level IS NOT NULL GROUP BY intensity_level ORDER BY count DESC`, params),
      pool.query(`SELECT trigger_name, COUNT(*) AS count FROM (SELECT unnest(triggers) AS trigger_name FROM conflict_incidents WHERE ${where} AND triggers IS NOT NULL AND array_length(triggers, 1) > 0) sub GROUP BY trigger_name ORDER BY count DESC`, params),
    ]);
    res.json({
      byLga: byLga.rows,
      byIntensity: byIntensity.rows,
      triggers: triggers.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
