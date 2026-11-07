import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

function imageUrl(p) {
  if (!p) return null;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `${API}/website/files/${p}`;
}

export function NewsAdminPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', excerpt: '', body: '', status: 'draft' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState(null);

  useEffect(() => {
    fetch(`${API}/website/admin/news`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPosts)
      .finally(() => setLoading(false));
  }, []);

  // Revoke blob URLs on cleanup
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function resetForm() {
    setForm({ title: '', excerpt: '', body: '', status: 'draft' });
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setEditing(null);
    setError('');
  }

  function openAdd() {
    resetForm();
    setShowForm(true);
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing ? `${API}/website/admin/news/${editing.id}` : `${API}/website/admin/news`;
      const method = editing ? 'PATCH' : 'POST';

      // Use FormData to support image upload
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('excerpt', form.excerpt);
      fd.append('body', form.body);
      fd.append('status', form.status);
      if (imageFile) fd.append('featured_image', imageFile);

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPosts((prev) => (editing ? prev.map((p) => (p.id === data.id ? data : p)) : [data, ...prev]));
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p) {
    setEditing(p);
    setForm({ title: p.title, excerpt: p.excerpt || '', body: p.body || '', status: p.status || 'draft' });
    setImageFile(null);
    setImagePreview(p.featured_image_path ? imageUrl(p.featured_image_path) : null);
    setShowForm(true);
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>News & Blog</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          <button type="button" onClick={openAdd} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Add Post</button>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Post' : 'Add Post'} width="780px">
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.5rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title</label>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Post title" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Excerpt</label>
            <input value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary" style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          </div>

          {/* Featured Image Upload */}
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Featured Image</label>
            {imagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '0.5rem' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--color-border)',
                    display: 'block',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <label
                    style={{
                      padding: '0.35rem 0.75rem',
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    Change image
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  </label>
                  <button
                    type="button"
                    onClick={removeImage}
                    style={{
                      padding: '0.35rem 0.75rem',
                      border: '1px solid #fca5a5',
                      background: '#fef2f2',
                      color: '#dc2626',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1rem',
                  border: '2px dashed var(--color-border)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  background: 'var(--color-bg)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--color-primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Upload image
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  JPG, PNG or WebP — max 10 MB
                </span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Body</label>
            <RichTextEditor value={form.body} onChange={(html) => setForm((f) => ({ ...f, body: html }))} placeholder="Write your post content…" minHeight="180px" />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={saving} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{saving ? 'Saving…' : editing ? 'Update' : 'Add post'}</button>
            <button type="button" onClick={closeForm} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Cancel</button>
          </div>
        </form>
      </Modal>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Posts</h2>
        {requestSuccess && <p style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Request submitted. An admin can approve in Approvals.</p>}
        {posts.length === 0 ? <p style={{ color: 'var(--color-text-muted)' }}>No posts yet.</p> : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {posts.map((p) => (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', flexWrap: 'wrap', gap: '0.75rem' }}>
                {/* Thumbnail */}
                <div style={{ width: 64, height: 48, borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--color-bg)', flexShrink: 0 }}>
                  {p.featured_image_path ? (
                    <img src={imageUrl(p.featured_image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: '0.75rem' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{p.title}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                    {p.status} · {p.published_at ? new Date(p.published_at).toLocaleDateString() : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {p.status !== 'published' && (
                    <button type="button" onClick={async () => { try { const r = await fetch(`${API}/website/admin/approvals`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_type: 'news_post', entity_id: p.id }) }); if (r.ok) { setRequestSuccess(p.id); setTimeout(() => setRequestSuccess(null), 3000); } } catch (_) {} }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Request approval</button>
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
