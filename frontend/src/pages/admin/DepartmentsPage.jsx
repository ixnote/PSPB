import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';
import { Modal } from '../../components/Modal';

const API = '/api';

const inputStyle = {
  width: '100%',
  padding: '0.5rem 0.65rem',
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

export function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', sort_order: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadDepartments = useCallback(() => {
    return fetch(`${API}/website/admin/departments`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setDepartments);
  }, []);

  useEffect(() => {
    loadDepartments().finally(() => setLoading(false));
  }, [loadDepartments]);

  function openAddForm() {
    setEditing(null);
    setForm({ name: '', sort_order: departments.length });
    setError('');
    setShowForm(true);
  }

  function openEditForm(dept) {
    setEditing(dept);
    setForm({ name: dept.name, sort_order: dept.sort_order ?? 0 });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Unit name is required'); return; }
    setError('');
    setSaving(true);
    try {
      const url = editing
        ? `${API}/website/admin/departments/${editing.id}`
        : `${API}/website/admin/departments`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), sort_order: form.sort_order }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await loadDepartments();
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API}/website/admin/departments/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      await loadDepartments();
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ margin: 0 }}>Units</h1>
          <span style={{
            background: 'var(--color-primary)', color: 'white',
            padding: '0.25rem 0.6rem', borderRadius: 'var(--radius)',
            fontSize: '0.85rem', fontWeight: 600,
          }}>
            {departments.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          <button
            type="button"
            onClick={openAddForm}
            style={{
              padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white',
              border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Add Unit
          </button>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editing ? 'Edit Unit' : 'Add Unit'} width="480px">
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Unit name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. Programme"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <label style={labelStyle}>Sort order</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                min={0}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white',
                border: 'none', borderRadius: 'var(--radius)', fontWeight: 600,
                cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : editing ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={closeForm}
              style={{
                padding: '0.5rem 1rem', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', borderRadius: 'var(--radius)', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {error && !showForm && (
        <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>
      )}

      {departments.length === 0 ? (
        <div style={{
          padding: '3rem 2rem', textAlign: 'center',
          background: 'var(--color-surface)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', color: 'var(--color-text-muted)',
        }}>
          <p style={{ margin: 0 }}>No units yet. Click "Add Unit" to get started.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--color-surface)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Unit</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', width: '100px' }}>Order</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', width: '160px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>{dept.name}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{dept.sort_order}</td>
                  <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => openEditForm(dept)}
                        style={{
                          padding: '0.3rem 0.65rem', border: '1px solid var(--color-border)',
                          background: 'var(--color-bg)', borderRadius: 'var(--radius)',
                          fontSize: '0.85rem', cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      {deleteConfirmId === dept.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDelete(dept.id)}
                            style={{
                              padding: '0.3rem 0.65rem', background: 'var(--color-error)',
                              color: 'white', border: 'none', borderRadius: 'var(--radius)',
                              fontSize: '0.85rem', cursor: 'pointer',
                            }}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            style={{
                              padding: '0.3rem 0.65rem', border: '1px solid var(--color-border)',
                              background: 'var(--color-bg)', borderRadius: 'var(--radius)',
                              fontSize: '0.85rem', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(dept.id)}
                          style={{
                            padding: '0.3rem 0.65rem', border: '1px solid var(--color-error)',
                            color: 'var(--color-error)', background: 'transparent',
                            borderRadius: 'var(--radius)', fontSize: '0.85rem', cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
