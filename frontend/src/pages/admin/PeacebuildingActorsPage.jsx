import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

/* Roles allowed to create/edit/delete actors (must match backend requireRole) */
const WRITE_ROLES = ['merl', 'programme', 'admin'];

const API = '/api';

const EMPTY_FORM = {
  name: '', year_established: '', actor_type: 'Non-State Actor', expertise: '',
  office_address: '', contact_name: '', contact_position: '', contact_email: '',
  contact_phone: '', website: '', focus_areas: '', lga: '', intervention_type: '',
  lgas_of_intervention: '', community_of_intervention: '', target_group: '',
  donors: '', observation: '', is_active: true,
};

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' };

export function PeacebuildingActorsPage() {
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role || '');

  const [actors, setActors] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLga, setFilterLga] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const loadActors = useCallback(() => {
    const params = filterLga ? `?lga=${encodeURIComponent(filterLga)}` : '';
    return fetch(`${API}/conflict/actors${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed'))))
      .then(setActors);
  }, [filterLga]);

  useEffect(() => {
    fetch(`${API}/conflict/lgas`).then((r) => r.json()).then(setLgas).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadActors().catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [loadActors]);

  const filtered = actors.filter((a) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (a.name || '').toLowerCase().includes(s) || (a.contact_name || '').toLowerCase().includes(s) || (a.expertise || '').toLowerCase().includes(s);
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      focus_areas: form.focus_areas ? form.focus_areas.split(',').map((t) => t.trim()).filter(Boolean) : null,
      lgas_of_intervention: form.lgas_of_intervention ? form.lgas_of_intervention.split(',').map((t) => t.trim()).filter(Boolean) : null,
    };
    try {
      const url = editing ? `${API}/conflict/actors/${editing.id}` : `${API}/conflict/actors`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      loadActors();
      setForm({ ...EMPTY_FORM });
      setEditing(null);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this organization? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`${API}/conflict/actors/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      loadActors();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(actor) {
    setEditing(actor);
    setForm({
      name: actor.name || '',
      year_established: actor.year_established || '',
      actor_type: actor.actor_type || 'Non-State Actor',
      expertise: actor.expertise || '',
      office_address: actor.office_address || '',
      contact_name: actor.contact_name || '',
      contact_position: actor.contact_position || '',
      contact_email: actor.contact_email || '',
      contact_phone: actor.contact_phone || '',
      website: actor.website || '',
      focus_areas: Array.isArray(actor.focus_areas) ? actor.focus_areas.join(', ') : (actor.focus_areas || ''),
      lga: actor.lga || '',
      intervention_type: actor.intervention_type || '',
      lgas_of_intervention: Array.isArray(actor.lgas_of_intervention) ? actor.lgas_of_intervention.join(', ') : (actor.lgas_of_intervention || ''),
      community_of_intervention: actor.community_of_intervention || '',
      target_group: actor.target_group || '',
      donors: actor.donors || '',
      observation: actor.observation || '',
      is_active: actor.is_active !== false,
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Peacebuilding Actors</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{actors.length} organization{actors.length !== 1 ? 's' : ''} registered</p>
        </div>
        {canWrite && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY_FORM }); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>
              + Add Organization
            </button>
          </div>
        )}
      </div>

      {/* Form */}
      <Modal isOpen={showForm && canWrite} onClose={cancelEdit} title={editing ? 'Edit Organization' : 'Add New Organization'} width="900px">
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Organization Name *</label>
                <input value={form.name} onChange={set('name')} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year Established</label>
                <input value={form.year_established} onChange={set('year_established')} style={inputStyle} placeholder="e.g. 2005" />
              </div>
              <div>
                <label style={labelStyle}>Actor Type</label>
                <select value={form.actor_type} onChange={set('actor_type')} style={inputStyle}>
                  <option value="Non-State Actor">Non-State Actor</option>
                  <option value="State Actor">State Actor</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Primary LGA</label>
                <select value={form.lga} onChange={set('lga')} style={inputStyle}>
                  <option value="">— Select —</option>
                  {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Contact Name</label>
                <input value={form.contact_name} onChange={set('contact_name')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Position</label>
                <input value={form.contact_position} onChange={set('contact_position')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.contact_email} onChange={set('contact_email')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={form.contact_phone} onChange={set('contact_phone')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input value={form.website} onChange={set('website')} style={inputStyle} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>Type of Intervention</label>
                <input value={form.intervention_type} onChange={set('intervention_type')} style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Expertise / Description</label>
                <RichTextEditor value={form.expertise} onChange={(html) => setForm((f) => ({ ...f, expertise: html }))} placeholder="Describe the organization's expertise…" minHeight="120px" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Office Address</label>
                <input value={form.office_address} onChange={set('office_address')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Focus Areas (comma-separated)</label>
                <input value={form.focus_areas} onChange={set('focus_areas')} style={inputStyle} placeholder="e.g. mediation, youth, women" />
              </div>
              <div>
                <label style={labelStyle}>LGAs of Intervention (comma-separated)</label>
                <input value={form.lgas_of_intervention} onChange={set('lgas_of_intervention')} style={inputStyle} placeholder="e.g. Jos North, Jos South, Barkin Ladi" />
              </div>
              <div>
                <label style={labelStyle}>Community of Intervention</label>
                <input value={form.community_of_intervention} onChange={set('community_of_intervention')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Target Group</label>
                <input value={form.target_group} onChange={set('target_group')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Donors</label>
                <input value={form.donors} onChange={set('donors')} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Observation</label>
                <input value={form.observation} onChange={set('observation')} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} id="is_active" />
                <label htmlFor="is_active" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Active</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1.2rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                {saving ? 'Saving…' : editing ? 'Update Organization' : 'Add Organization'}
              </button>
              <button type="button" onClick={cancelEdit} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                Cancel
              </button>
            </div>
          </form>
      </Modal>

      {/* Filters */}
      <section style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ ...labelStyle, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Search</label>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search organizations..." style={inputStyle} />
        </div>
        <div>
          <label style={{ ...labelStyle, fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Filter by LGA</label>
          <select value={filterLga} onChange={(e) => setFilterLga(e.target.value)} style={inputStyle}>
            <option value="">All LGAs</option>
            {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </section>

      {/* List */}
      <section>
        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No organizations found.{canWrite && !showForm ? ' Click "Add Organization" to get started.' : ''}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {filtered.map((a) => (
              <div key={a.id} style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', opacity: a.is_active === false ? 0.6 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <strong style={{ fontSize: '1rem' }}>{a.name}</strong>
                    <span style={{
                      display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
                      background: a.actor_type === 'State Actor' ? '#dbeafe' : '#dcfce7',
                      color: a.actor_type === 'State Actor' ? '#1d4ed8' : '#166534',
                    }}>
                      {a.actor_type || 'N/A'}
                    </span>
                    {a.is_active === false && <span style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}>INACTIVE</span>}
                  </div>
                  {a.lga && <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>{a.lga} {a.year_established && `· Est. ${a.year_established}`}</div>}
                  {a.contact_name && <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{a.contact_name} {a.contact_position && `— ${a.contact_position}`}</div>}
                  {(a.contact_email || a.contact_phone) && <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{a.contact_email || ''} {a.contact_phone ? `· ${a.contact_phone}` : ''}</div>}
                  {a.expertise && <div style={{ fontSize: '0.82rem', marginTop: '0.3rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.expertise}</div>}
                </div>
                {canWrite && (
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button type="button" onClick={() => startEdit(a)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.85rem', cursor: 'pointer' }}>Edit</button>
                    <button type="button" onClick={() => handleDelete(a.id)} disabled={deleting === a.id} style={{ padding: '0.35rem 0.7rem', border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 'var(--radius)', fontSize: '0.85rem', color: '#dc2626', cursor: 'pointer' }}>{deleting === a.id ? '…' : 'Delete'}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
