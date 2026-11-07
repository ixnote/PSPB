import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

export function ContentPagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ slug: '', title: '', body: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  useEffect(() => {
    fetch(`${API}/website/admin/pages`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPages)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing ? `${API}/website/admin/pages/${editing.id}` : `${API}/website/admin/pages`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPages((prev) => (editing ? prev.map((p) => (p.id === data.id ? data : p)) : [data, ...prev]));
      setEditing(null);
      setForm({ slug: '', title: '', body: '', status: 'draft' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p) {
    setEditing(p);
    setForm({ slug: p.slug, title: p.title, body: p.body || '', status: p.status || 'draft' });
    setShowForm(true);
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Content pages</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          <button type="button" onClick={() => { setEditing(null); setForm({ slug: '', title: '', body: '', status: 'draft' }); setShowForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Add Page</button>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); setForm({ slug: '', title: '', body: '', status: 'draft' }); }} title={editing ? 'Edit Page' : 'Add Page'}>
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Slug (URL)</label>
              <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="about" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Page title" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Body</label>
              <RichTextEditor value={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="Write your page content…" minHeight="180px" />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add page'}</button>
          {editing && <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ slug: '', title: '', body: '', status: 'draft' }); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>}
        </form>
      </Modal>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Pages</h2>
        {requestSuccess && <p style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Request submitted. An admin can approve in Approvals.</p>}
        {pages.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No pages. Add one above (e.g. slug "about" for /about).</p> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {pages.map((p) => (
              <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span><strong>{p.title}</strong> · /{p.slug} · {p.status}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {p.status !== 'published' && (
                    <button type="button" onClick={async () => { try { const r = await fetch(`${API}/website/admin/approvals`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_type: 'content_page', entity_id: p.id }) }); if (r.ok) { setRequestSuccess(p.id); setTimeout(() => setRequestSuccess(null), 3000); } } catch (_) {} }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Request approval</button>
                  )}
                  <button type="button" onClick={() => startEdit(p)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Edit</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
