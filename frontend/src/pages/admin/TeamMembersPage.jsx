import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { RichTextEditor } from '../../components/RichTextEditor';
import { Modal } from '../../components/Modal';

const API = '/api';

const CATEGORIES = ['management', 'staff', 'board', 'advisory'];

function imageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API}/website/files/${path}`;
}

function getInitials(fullName) {
  if (!fullName) return '?';
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();
}

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.6rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.9rem',
};
const labelStyle = {
  display: 'block',
  marginBottom: '0.25rem',
  fontWeight: 600,
  fontSize: '0.85rem',
  color: 'var(--color-text-muted)',
};

export function TeamMembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    title: '',
    department: '',
    category: 'management',
    bio: '',
    email: '',
    phone: '',
    sort_order: 0,
    is_active: true,
  });

  const [departments, setDepartments] = useState([]);

  const loadMembers = useCallback(() => {
    const headers = getAuthHeaders();
    return fetch(`${API}/website/team/admin`, { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then(setMembers);
  }, []);

  const loadDepartments = useCallback(() => {
    return fetch(`${API}/website/departments`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDepartments);
  }, []);

  useEffect(() => {
    Promise.all([loadMembers(), loadDepartments()]).finally(() => setLoading(false));
  }, [loadMembers, loadDepartments]);

  useEffect(() => {
    return () => {
      if (photoPreview && photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const filteredMembers =
    categoryFilter === 'all'
      ? members
      : members.filter((m) => m.category === categoryFilter);

  function openAddForm() {
    setEditing(null);
    setForm({
      full_name: '',
      title: '',
      department: '',
      category: 'management',
      bio: '',
      email: '',
      phone: '',
      sort_order: members.length,
      is_active: true,
    });
    setPhotoPreview(null);
    setPhotoFile(null);
    setError('');
    setShowForm(true);
  }

  function openEditForm(m) {
    setEditing(m);
    setForm({
      full_name: m.full_name || '',
      title: m.title || '',
      department: m.department || '',
      category: m.category || 'management',
      bio: m.bio || '',
      email: m.email || '',
      phone: m.phone || '',
      sort_order: m.sort_order ?? 0,
      is_active: m.is_active !== false,
    });
    setPhotoPreview(m.photo_path ? imageUrl(m.photo_path) : null);
    setPhotoFile(null);
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setPhotoPreview((prev) => {
      if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
      return null;
    });
    setShowForm(false);
    setEditing(null);
    setPhotoFile(null);
    setError('');
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview((prev) => {
        if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const headers = getAuthHeaders();
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('title', form.title);
      fd.append('department', form.department);
      fd.append('category', form.category);
      fd.append('bio', form.bio);
      fd.append('email', form.email);
      fd.append('phone', form.phone);
      fd.append('sort_order', String(form.sort_order));
      fd.append('is_active', String(form.is_active));
      if (photoFile) fd.append('photo', photoFile);

      const url = editing
        ? `${API}/website/team/${editing.id}`
        : `${API}/website/team`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadMembers();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const headers = getAuthHeaders();
    try {
      const res = await fetch(`${API}/website/team/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadMembers();
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Team Members</h1>
          <span
            style={{
              background: 'var(--color-primary)',
              color: 'white',
              padding: '0.25rem 0.6rem',
              borderRadius: 'var(--radius)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {members.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>
            ← Dashboard
          </Link>
          <button
            type="button"
            onClick={openAddForm}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add Member
          </button>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Member' : 'Add Member'} width="800px">
          {error && (
            <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              {/* Photo upload */}
              <div>
                <label style={labelStyle}>Photo</label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                      background: 'var(--color-bg)',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      getInitials(form.full_name || '')
                    )}
                  </div>
                  <label
                    style={{
                      padding: '0.4rem 0.8rem',
                      background: 'var(--color-primary)',
                      color: 'white',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'inline-block',
                    }}
                  >
                    {photoFile ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Full name *</label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  required
                  placeholder="Full name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Job title"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Unit</label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, department: e.target.value }))
                  }
                  style={inputStyle}
                >
                  <option value="">— Select department —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="email@example.com"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="Phone number"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Sort order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sort_order: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  min={0}
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  paddingTop: '1.5rem',
                }}
              >
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                />
                <label htmlFor="is_active" style={{ ...labelStyle, marginBottom: 0 }}>
                  Active
                </label>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <label style={labelStyle}>Bio</label>
              <RichTextEditor value={form.bio} onChange={(html) => setForm((f) => ({ ...f, bio: html }))} placeholder="Write a short biography…" minHeight="120px" />
            </div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 600,
                  cursor: saving ? 'default' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
      </Modal>

      {/* Category filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.25rem',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        {['all', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderBottom:
                categoryFilter === cat
                  ? '2px solid var(--color-primary)'
                  : '2px solid transparent',
              background: 'none',
              color:
                categoryFilter === cat
                  ? 'var(--color-primary)'
                  : 'var(--color-text-muted)',
              fontWeight: categoryFilter === cat ? 600 : 400,
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {error && !showForm && (
        <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>
          {error}
        </p>
      )}

      {filteredMembers.length === 0 ? (
        <div
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            color: 'var(--color-text-muted)',
          }}
        >
          <p style={{ margin: 0, fontSize: '1rem' }}>
            {members.length === 0
              ? 'No team members yet. Click "Add Member" to get started.'
              : `No members in "${categoryFilter}" category.`}
          </p>
        </div>
      ) : (
        <div
          className="team-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
          }}
        >
          {filteredMembers.map((m) => (
            <div
              key={m.id}
              style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                padding: '1rem',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    background: 'var(--color-bg)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {m.photo_path ? (
                    <img
                      src={imageUrl(m.photo_path)}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    getInitials(m.full_name)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {m.full_name}
                  </div>
                  {m.title && (
                    <div
                      style={{
                        fontSize: '0.9rem',
                        color: 'var(--color-text)',
                        marginBottom: '0.15rem',
                      }}
                    >
                      {m.title}
                    </div>
                  )}
                  {m.department && (
                    <div
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--color-text-muted)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {m.department}
                    </div>
                  )}
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {m.category || '—'}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: '0.5rem',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius)',
                      background: m.is_active
                        ? 'rgba(34, 197, 94, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: m.is_active
                        ? 'rgb(22, 163, 74)'
                        : 'rgb(185, 28, 28)',
                    }}
                  >
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '0.25rem',
                    }}
                  >
                    Sort: {m.sort_order ?? 0}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: 'auto',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => openEditForm(m)}
                  style={{
                    padding: '0.35rem 0.7rem',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
                {deleteConfirmId === m.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: 'var(--color-error)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(m.id)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      border: '1px solid var(--color-error)',
                      color: 'var(--color-error)',
                      background: 'transparent',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .team-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 640px) {
          .team-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
