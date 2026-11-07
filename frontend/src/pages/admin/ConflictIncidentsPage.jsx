import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

/* Roles allowed to create/edit incidents (must match backend requireRole) */
const WRITE_ROLES = ['merl', 'programme', 'admin', 'case_reporting', 'field_officer'];
const DELETE_ROLES = ['merl', 'programme', 'admin'];

const API = '/api';
const INTENSITY_LEVELS = ['low', 'medium', 'high', 'critical'];
const INCIDENT_TYPES = ['Armed Attacks', 'Hoodlums', 'Kidnapping', 'Communal Clash', 'Cattle Rustling', 'Farmer-Herder', 'Robbery', 'Cult Violence', 'Political Violence', 'Other'];
const INTENSITY_COLORS = { low: '#86efac', medium: '#fde047', high: '#f97316', critical: '#dc2626' };

const inputStyle = { width: '100%', padding: '0.45rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' };
const labelStyle = { display: 'block', marginBottom: '0.2rem', fontWeight: 600, fontSize: '0.8rem', color: 'var(--color-text-muted)' };

const emptyForm = {
  lga: '', title: '', description: '', incident_date: '', incident_time: '', intensity_level: '', triggers: '',
  district: '', incident_type: '', actor: '', place_of_attack: '', deaths: '', injured: '', property_destroyed: '', idps: '', source: '', observation: '',
};

export function ConflictIncidentsPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const canWrite = WRITE_ROLES.includes(role);
  const canDelete = DELETE_ROLES.includes(role);

  const [incidents, setIncidents] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({ lga: '', from: '', to: '', intensity: '', type: '' });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadIncidents = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.lga) params.set('lga', filters.lga);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.intensity) params.set('intensity', filters.intensity);
    return fetch(`${API}/conflict/incidents?${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed'))))
      .then(setIncidents);
  }, [filters.lga, filters.from, filters.to, filters.intensity]);

  useEffect(() => {
    fetch(`${API}/conflict/lgas`).then((r) => r.json()).then(setLgas).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadIncidents().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [loadIncidents]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    const payload = {
      ...form,
      triggers: form.triggers ? form.triggers.split(',').map((t) => t.trim()).filter(Boolean) : null,
    };
    try {
      const url = editing ? `${API}/conflict/incidents/${editing.id}` : `${API}/conflict/incidents`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      loadIncidents();
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      setSuccess(editing ? 'Incident updated.' : 'Incident recorded.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  function startEdit(inc) {
    setEditing(inc);
    setShowForm(true);
    setForm({
      lga: inc.lga || '', title: inc.title || '', description: inc.description || '',
      incident_date: inc.incident_date ? inc.incident_date.slice(0, 10) : '', incident_time: inc.incident_time || '',
      intensity_level: inc.intensity_level || '',
      triggers: Array.isArray(inc.triggers) ? inc.triggers.join(', ') : (inc.triggers || ''),
      district: inc.district || '', incident_type: inc.incident_type || '', actor: inc.actor || '',
      place_of_attack: inc.place_of_attack || '', deaths: inc.deaths ?? '', injured: inc.injured ?? '',
      property_destroyed: inc.property_destroyed || '', idps: inc.idps ?? '', source: inc.source || '', observation: inc.observation || '',
    });
  }

  // Summary stats
  const totalDeaths = incidents.reduce((s, i) => s + (i.deaths || 0), 0);
  const totalInjured = incidents.reduce((s, i) => s + (i.injured || 0), 0);
  const totalIdps = incidents.reduce((s, i) => s + (i.idps || 0), 0);

  return (
    <div style={{ padding: '1.5rem 1.5rem 3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Conflict Incidents</h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Record and manage conflict and security incidents across Plateau State.</p>
        </div>
        {canWrite && (
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm(emptyForm); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
            {showForm ? 'Close Form' : '+ Report Incident'}
          </button>
        )}
      </div>

      {error && <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: 'var(--color-error)', borderRadius: 'var(--radius)', marginBottom: '0.75rem', fontSize: '0.9rem', border: '1px solid #fecaca' }}>{error}</div>}
      {success && <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius)', marginBottom: '0.75rem', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>{success}</div>}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
        {[
          { label: 'Total Incidents', value: incidents.length, color: '#f97316' },
          { label: 'Deaths', value: totalDeaths, color: '#dc2626' },
          { label: 'Injured', value: totalInjured, color: '#eab308' },
          { label: 'IDPs', value: totalIdps, color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--color-surface)', borderLeft: `4px solid ${s.color}`, borderRadius: 'var(--radius)', padding: '0.75rem', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--color-surface)', padding: '0.75rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <select value={filters.lga} onChange={(e) => setFilters((f) => ({ ...f, lga: e.target.value }))} style={{ ...inputStyle, width: 'auto', minWidth: '140px' }}>
            <option value="">All LGAs</option>
            {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.intensity} onChange={(e) => setFilters((f) => ({ ...f, intensity: e.target.value }))} style={{ ...inputStyle, width: 'auto', minWidth: '130px' }}>
            <option value="">All Intensities</option>
            {INTENSITY_LEVELS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} style={{ ...inputStyle, width: 'auto' }} title="From date" />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>to</span>
          <input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} style={{ ...inputStyle, width: 'auto' }} title="To date" />
          {(filters.lga || filters.intensity || filters.from || filters.to) && (
            <button onClick={() => setFilters({ lga: '', from: '', to: '', intensity: '', type: '' })} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.85rem', cursor: 'pointer' }}>Clear</button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      <Modal isOpen={showForm && canWrite} onClose={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} title={editing ? 'Edit Incident' : 'Report New Incident'} width="900px">
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div><label style={labelStyle}>LGA *</label>
                <select value={form.lga} onChange={(e) => setForm((f) => ({ ...f, lga: e.target.value }))} required style={inputStyle}>
                  <option value="">Select</option>{lgas.map((l) => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div><label style={labelStyle}>District</label><input value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} style={inputStyle} placeholder="e.g. Shere District" /></div>
              <div><label style={labelStyle}>Date of Incident</label><input type="date" value={form.incident_date} onChange={(e) => setForm((f) => ({ ...f, incident_date: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Time</label><input type="time" value={form.incident_time} onChange={(e) => setForm((f) => ({ ...f, incident_time: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Type of Incident</label>
                <select value={form.incident_type} onChange={(e) => setForm((f) => ({ ...f, incident_type: e.target.value }))} style={inputStyle}>
                  <option value="">Select</option>{INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select></div>
              <div><label style={labelStyle}>Actor</label><input value={form.actor} onChange={(e) => setForm((f) => ({ ...f, actor: e.target.value }))} style={inputStyle} placeholder="e.g. Unknown gunmen" /></div>
              <div><label style={labelStyle}>Place of Attack</label><input value={form.place_of_attack} onChange={(e) => setForm((f) => ({ ...f, place_of_attack: e.target.value }))} style={inputStyle} placeholder="e.g. Durbe" /></div>
              <div><label style={labelStyle}>Conflict Trigger</label><input value={form.triggers} onChange={(e) => setForm((f) => ({ ...f, triggers: e.target.value }))} style={inputStyle} placeholder="e.g. land, cattle" /></div>
              <div><label style={labelStyle}>Intensity</label>
                <select value={form.intensity_level} onChange={(e) => setForm((f) => ({ ...f, intensity_level: e.target.value }))} style={inputStyle}>
                  <option value="">Select</option>{INTENSITY_LEVELS.map((i) => <option key={i} value={i}>{i}</option>)}
                </select></div>
              <div><label style={labelStyle}># Deaths</label><input type="number" min="0" value={form.deaths} onChange={(e) => setForm((f) => ({ ...f, deaths: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}># Injured</label><input type="number" min="0" value={form.injured} onChange={(e) => setForm((f) => ({ ...f, injured: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}># IDPs</label><input type="number" min="0" value={form.idps} onChange={(e) => setForm((f) => ({ ...f, idps: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <div><label style={labelStyle}>Title / Summary</label><input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="Brief title" /></div>
              <div><label style={labelStyle}>Source</label><input value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))} style={inputStyle} placeholder="e.g. PPBA Community Security Architecture" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <div><label style={labelStyle}>Property Destroyed</label><input value={form.property_destroyed} onChange={(e) => setForm((f) => ({ ...f, property_destroyed: e.target.value }))} style={inputStyle} /></div>
              <div><label style={labelStyle}>Observation</label><input value={form.observation} onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: '0.6rem' }}><label style={labelStyle}>Description</label>
              <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Describe the incident…" minHeight="100px" /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                {saving ? 'Saving…' : editing ? 'Update Incident' : 'Record Incident'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(emptyForm); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>
            </div>
          </form>
      </Modal>

      {/* Incidents Table */}
      {loading ? <p>Loading…</p> : incidents.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No incidents found. Use the button above to report one.</p> : (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {['Date', 'LGA', 'District', 'Type', 'Place', 'Trigger', 'Deaths', 'Injured', 'IDPs', 'Intensity', 'Source', ...(canWrite ? [''] : [])].map((h) => (
                  <th key={h} style={{ padding: '0.5rem 0.4rem', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.45rem 0.4rem', whiteSpace: 'nowrap' }}>{inc.incident_date ? new Date(inc.incident_date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.45rem 0.4rem', fontWeight: 500 }}>{inc.lga}</td>
                  <td style={{ padding: '0.45rem 0.4rem', color: 'var(--color-text-muted)' }}>{inc.district || '—'}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>{inc.incident_type || '—'}</td>
                  <td style={{ padding: '0.45rem 0.4rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.place_of_attack || '—'}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>{Array.isArray(inc.triggers) ? inc.triggers.join(', ') : (inc.triggers || '—')}</td>
                  <td style={{ padding: '0.45rem 0.4rem', fontWeight: inc.deaths > 0 ? 700 : 400, color: inc.deaths > 0 ? '#dc2626' : 'inherit' }}>{inc.deaths || 0}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>{inc.injured || 0}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>{inc.idps || 0}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    {inc.intensity_level ? (
                      <span style={{ padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600, background: INTENSITY_COLORS[inc.intensity_level] || '#eee', color: inc.intensity_level === 'critical' || inc.intensity_level === 'high' ? '#fff' : '#333' }}>
                        {inc.intensity_level}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{inc.source || '—'}</td>
                  {canWrite && (
                    <td style={{ padding: '0.45rem 0.4rem' }}>
                      <button onClick={() => startEdit(inc)} style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer' }}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
