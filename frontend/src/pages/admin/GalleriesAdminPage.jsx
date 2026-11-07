import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { imageUrl } from '../../lib/imageUrl';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

export function GalleriesAdminPage() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ title: '', slug: '', description: '', status: 'draft' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  function loadGalleries() {
    return fetch(`${API}/website/admin/galleries`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setGalleries);
  }

  useEffect(() => {
    loadGalleries().finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing ? `${API}/website/admin/galleries/${editing.id}` : `${API}/website/admin/galleries`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadGalleries();
      setEditing(null);
      setForm({ title: '', slug: '', description: '', status: 'draft' });
      if (!editing) setViewing(data.id);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddImage(galleryId, file) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/website/admin/galleries/${galleryId}/items`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await loadGalleries();
      const full = await fetch(`${API}/website/admin/galleries/${galleryId}`, { headers: getAuthHeaders() }).then((r) => r.json());
      setGalleryWithItems(full);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteItem(galleryId, itemId) {
    try {
      const res = await fetch(`${API}/website/admin/galleries/${galleryId}/items/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadGalleries();
      const full = await fetch(`${API}/website/admin/galleries/${galleryId}`, { headers: getAuthHeaders() }).then((r) => r.json());
      setGalleryWithItems(full);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSetCover(galleryId, filePath) {
    try {
      const res = await fetch(`${API}/website/admin/galleries/${galleryId}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_image_path: filePath }),
      });
      if (!res.ok) throw new Error('Failed');
      await loadGalleries();
      if (viewGalleryFull?.id === galleryId) {
        const full = await fetch(`${API}/website/admin/galleries/${galleryId}`, { headers: getAuthHeaders() }).then((r) => r.json());
        setGalleryWithItems(full);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(g) {
    setEditing(g);
    setForm({ title: g.title, slug: g.slug, description: g.description || '', status: g.status || 'draft' });
    setShowForm(true);
  }

  const [galleryWithItems, setGalleryWithItems] = useState(null);

  useEffect(() => {
    if (typeof viewing === 'number') {
      fetch(`${API}/website/admin/galleries/${viewing}`, { headers: getAuthHeaders() })
        .then((r) => (r.ok ? r.json() : null))
        .then(setGalleryWithItems);
    } else {
      setGalleryWithItems(null);
    }
  }, [viewing]);

  const viewGalleryFull = galleryWithItems;

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Photo galleries</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          <button type="button" onClick={() => { setEditing(null); setForm({ title: '', slug: '', description: '', status: 'draft' }); setShowForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Add Gallery</button>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditing(null); setForm({ title: '', slug: '', description: '', status: 'draft' }); }} title={editing ? 'Edit Gallery' : 'Add Gallery'}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Gallery title" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Slug (URL)</label>
              <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Description</label>
              <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Optional description…" minHeight="100px" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add gallery'}</button>
          {editing && <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm({ title: '', slug: '', description: '', status: 'draft' }); }} style={{ marginLeft: '0.5rem', padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>}
        </form>
      </Modal>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Galleries</h2>
        {galleries.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No galleries yet. Add one above.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {galleries.map((g) => (
              <li key={g.id} style={{ marginBottom: '0.75rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--color-bg)', borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0 }}>
                    {g.cover_image_path ? (
                      <img src={imageUrl(g.cover_image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{g.title}</strong>
                    <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>/galleries/{g.slug}</span>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>({g.status})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setViewing(g.id)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Manage images</button>
                    <button type="button" onClick={() => startEdit(g)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Edit</button>
                    {g.status === 'published' && <Link to={`/galleries/${g.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding: '0.35rem 0.7rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontSize: '0.9rem', textDecoration: 'none' }}>View</Link>}
                  </div>
                </div>

                {viewGalleryFull && viewGalleryFull.id === g.id && (
                  <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                    <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Images</h3>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', cursor: 'pointer' }}>
                        {uploading ? 'Uploading…' : 'Add image'}
                        <input type="file" accept="image/*" style={{ display: 'none' }} disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAddImage(g.id, f); e.target.value = ''; }} />
                      </label>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.75rem' }}>
                      {(viewGalleryFull.items || []).map((item) => (
                        <div key={item.id} style={{ position: 'relative', background: 'var(--color-surface)', borderRadius: 'var(--radius)', overflow: 'hidden', aspectRatio: 1 }}>
                          <img src={imageUrl(item.file_path)} alt={item.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {item.caption && <div style={{ padding: '0.25rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.6)', color: 'white', position: 'absolute', bottom: 0, left: 0, right: 0 }}>{item.caption}</div>}
                          <div style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', display: 'flex', gap: '0.25rem' }}>
                            {g.cover_image_path !== item.file_path && (
                              <button type="button" onClick={() => handleSetCover(g.id, item.file_path)} title="Set as cover" style={{ padding: '0.2rem', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>★</button>
                            )}
                            <button type="button" onClick={() => handleDeleteItem(g.id, item.id)} title="Remove" style={{ padding: '0.2rem', background: 'rgba(200,0,0,0.8)', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    {(!viewGalleryFull.items || viewGalleryFull.items.length === 0) && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No images yet. Add images above.</p>}
                    <button type="button" onClick={() => setViewing(null)} style={{ marginTop: '1rem', padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Close</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
