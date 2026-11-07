import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

export function EventsAdminPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', start_at: '', end_at: '', location: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  useEffect(() => {
    fetch(`${API}/website/admin/events`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing ? `${API}/website/admin/events/${editing.id}` : `${API}/website/admin/events`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setEvents((prev) => (editing ? prev.map((ev) => (ev.id === data.id ? data : ev)) : [data, ...prev]));
      setEditing(null);
      setForm({ title: '', description: '', start_at: '', end_at: '', location: '', status: 'draft' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(ev) {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || '',
      start_at: ev.start_at ? ev.start_at.slice(0, 16) : '',
      end_at: ev.end_at ? ev.end_at.slice(0, 16) : '',
      location: ev.location || '',
      status: ev.status || 'draft',
    });
    setShowForm(true);
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Events</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
        <button type="button" onClick={() => { setEditing(null); setForm({ title: '', description: '', start_at: '', end_at: '', location: '', status: 'draft' }); setShowForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Add Event</button>
      </div>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); setForm({ title: '', description: '', start_at: '', end_at: '', location: '', status: 'draft' }); }} title={editing ? 'Edit Event' : 'Add Event'}>
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title *</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Event title" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Start *</label>
              <input type="datetime-local" value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>End</label>
              <input type="datetime-local" value={form.end_at} onChange={(e) => setForm((f) => ({ ...f, end_at: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Location</label>
              <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Venue or address" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</label>
              <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Describe the event…" minHeight="120px" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add event'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm({ title: '', description: '', start_at: '', end_at: '', location: '', status: 'draft' }); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>}
        </form>
      </Modal>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Events</h2>
        {requestSuccess && <p style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Request submitted. An admin can approve in Approvals.</p>}
        {events.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No events yet.</p> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {events.map((ev) => (
              <li key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span><strong>{ev.title}</strong> · {ev.status} · {ev.start_at ? new Date(ev.start_at).toLocaleString() : '—'}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {ev.status !== 'published' && (
                    <button type="button" onClick={async () => { try { const r = await fetch(`${API}/website/admin/approvals`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_type: 'event', entity_id: ev.id }) }); if (r.ok) { setRequestSuccess(ev.id); setTimeout(() => setRequestSuccess(null), 3000); } } catch (_) {} }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Request approval</button>
                  )}
                  <button type="button" onClick={() => startEdit(ev)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Edit</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
