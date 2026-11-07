import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

const WRITE_ROLES = ['merl', 'strategic_communications', 'programme', 'admin'];
const DELETE_ROLES = ['admin'];

const EMPTY_FORM = {
  title: '', youtube_url: '', description: '', category: 'general',
  is_featured: false, is_published: true, sort_order: 0,
};

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' };

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function VideosAdminPage() {
  const { user } = useAuth();
  const canWrite = WRITE_ROLES.includes(user?.role || '');
  const canDelete = DELETE_ROLES.includes(user?.role || '');

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  function loadVideos() {
    return fetch(`${API}/website/admin/videos`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setVideos);
  }

  useEffect(() => {
    loadVideos().catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const url = editing ? `${API}/website/admin/videos/${editing.id}` : `${API}/website/admin/videos`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadVideos();
      setForm({ ...EMPTY_FORM });
      setEditing(null);
      setShowForm(false);
      setSuccess(editing ? 'Video updated.' : 'Video added.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this video?')) return;
    try {
      await fetch(`${API}/website/admin/videos/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      await loadVideos();
    } catch (err) {
      setError(err.message);
    }
  }

  function startEdit(v) {
    setEditing(v);
    setForm({
      title: v.title || '',
      youtube_url: v.youtube_url || '',
      description: v.description || '',
      category: v.category || 'general',
      is_featured: v.is_featured || false,
      is_published: v.is_published !== false,
      sort_order: v.sort_order ?? 0,
    });
    setShowForm(true);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
    setError('');
  }

  const filtered = videos.filter((v) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (v.title || '').toLowerCase().includes(s) || (v.category || '').toLowerCase().includes(s) || (v.description || '').toLowerCase().includes(s);
  });

  const previewId = extractVideoId(form.youtube_url);

  return (
    <div style={{ padding: '1.5rem 1.5rem 3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem' }}>YouTube Videos</h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            Manage video links displayed on the public website. {videos.length} video{videos.length !== 1 ? 's' : ''} total.
          </p>
        </div>
        {canWrite && !showForm && (
          <button
            onClick={() => { setShowForm(true); setEditing(null); setForm({ ...EMPTY_FORM }); }}
            style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}
          >
            + Add Video
          </button>
        )}
      </div>

      {error && <div style={{ padding: '0.5rem 1rem', background: '#fef2f2', color: 'var(--color-error)', borderRadius: 'var(--radius)', marginBottom: '0.75rem', fontSize: '0.9rem', border: '1px solid #fecaca' }}>{error}</div>}
      {success && <div style={{ padding: '0.5rem 1rem', background: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius)', marginBottom: '0.75rem', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>{success}</div>}

      {/* Add/Edit Form */}
      <Modal isOpen={showForm && canWrite} onClose={cancelEdit} title={editing ? 'Edit Video' : 'Add New Video'} width="720px">
        <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Title *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Video title" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>YouTube URL *</label>
                <input value={form.youtube_url} onChange={(e) => setForm((f) => ({ ...f, youtube_url: e.target.value }))} required placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
                  Paste a full YouTube link (watch, shorts, or embed URL).
                </p>
              </div>
              {previewId && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Preview</label>
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, maxWidth: '400px', borderRadius: 'var(--radius)', overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${previewId}`}
                      title="Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </div>
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <RichTextEditor value={form.description} onChange={(html) => setForm((f) => ({ ...f, description: html }))} placeholder="Optional description…" minHeight="100px" />
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. peacebuilding, events, interviews" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))} min={0} style={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', paddingTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
                  Published
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                  Featured
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
                {saving ? 'Saving...' : editing ? 'Update Video' : 'Add Video'}
              </button>
              <button type="button" onClick={cancelEdit} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>
            </div>
          </form>
      </Modal>

      {/* Search */}
      <div style={{ marginBottom: '1rem' }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search videos..." style={{ ...inputStyle, maxWidth: '300px' }} />
      </div>

      {/* Videos list */}
      {loading ? <p>Loading...</p> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', color: 'var(--color-text-muted)' }}>
          {videos.length === 0 ? 'No videos yet. Add your first YouTube video above.' : 'No videos match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {filtered.map((v) => {
            const vid = extractVideoId(v.youtube_url);
            return (
              <div key={v.id} style={{
                background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
                overflow: 'hidden', opacity: v.is_published ? 1 : 0.6, border: '1px solid var(--color-border)',
              }}>
                {/* Thumbnail */}
                <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                  {vid ? (
                    <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '2rem' }}>▶</div>
                  )}
                  {v.is_featured && (
                    <span style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', padding: '0.15rem 0.5rem', background: '#c4a35a', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px' }}>FEATURED</span>
                  )}
                  {!v.is_published && (
                    <span style={{ position: 'absolute', top: '0.4rem', right: '0.4rem', padding: '0.15rem 0.5rem', background: '#dc2626', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px' }}>DRAFT</span>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '0.75rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</div>
                  {v.description && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.description}</div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>{v.category || 'general'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Order: {v.sort_order}</span>
                  </div>
                  {canWrite && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" onClick={() => startEdit(v)} style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.82rem', cursor: 'pointer' }}>Edit</button>
                      {canDelete && (
                        <button type="button" onClick={() => handleDelete(v.id)} style={{ padding: '0.3rem 0.6rem', border: '1px solid #fca5a5', background: '#fef2f2', borderRadius: 'var(--radius)', fontSize: '0.82rem', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
                      )}
                      <a href={v.youtube_url} target="_blank" rel="noopener noreferrer" style={{ padding: '0.3rem 0.6rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.82rem', textDecoration: 'none', color: 'var(--color-text)' }}>Open ↗</a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
