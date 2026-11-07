import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../hooks/useAuth';
import { Modal } from '../../components/Modal';

const API = '/api';

const inputStyle = { width: '100%', padding: '0.5rem 0.65rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' };
const labelStyle = { display: 'block', marginBottom: '0.25rem', fontWeight: 600, fontSize: '0.85rem' };
const btnPrimary = { padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' };

export function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('users'); // 'users' | 'roles'
  const [form, setForm] = useState({ email: '', password: '', full_name: '', role: '' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);

  function loadData() {
    return Promise.all([
      fetch(`${API}/auth/users`, { headers: getAuthHeaders() }),
      fetch(`${API}/auth/roles`, { headers: getAuthHeaders() }),
    ]).then(([ur, rr]) => {
      if (!ur.ok || ur.status === 403) { setError('Admin access required'); return; }
      if (!rr.ok) return;
      return Promise.all([ur.json(), rr.json()]).then(([u, r]) => {
        setError('');
        setUsers(u);
        setRoles(r);
        if (r.length && !form.role) setForm((f) => ({ ...f, role: r[0].name }));
      });
    }).catch(() => setError('Failed to load'));
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  async function handleCreateUser(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await fetch(`${API}/auth/users`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUsers((prev) => [{ ...data, role: form.role }, ...prev]);
      setForm({ email: '', password: '', full_name: '', role: form.role });
      setSuccess(`User ${data.email} created successfully.`);
      setShowUserForm(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleCreateRole(e) {
    e.preventDefault();
    setError(''); setSuccess(''); setSaving(true);
    try {
      const res = await fetch(`${API}/auth/roles`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setRoles((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setRoleForm({ name: '', description: '' });
      setSuccess(`Role "${data.name}" created.`);
      setShowRoleForm(false);
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  async function handleChangeRole(userId, newRole) {
    setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/auth/users/${userId}/role`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setSuccess(`Role updated for ${data.email}.`);
    } catch (err) { setError(err.message); }
  }

  if (loading) return <div style={{ padding: '2rem' }}>Loading…</div>;

  const tabBtn = (t, label) => ({
    padding: '0.5rem 1.15rem',
    background: tab === t ? 'var(--color-primary)' : 'var(--color-surface)',
    color: tab === t ? '#fff' : 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderBottom: tab === t ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius) var(--radius) 0 0',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginRight: '-1px',
  });

  return (
    <div style={{ padding: '1.5rem 1.5rem 3rem' }}>
      <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem' }}>Users & Roles</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>Manage system users, create roles, and assign permissions.</p>

      {error && <div style={{ padding: '0.6rem 1rem', background: '#fef2f2', color: 'var(--color-error)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #fecaca' }}>{error}</div>}
      {success && <div style={{ padding: '0.6rem 1rem', background: '#f0fdf4', color: '#166534', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.9rem', border: '1px solid #bbf7d0' }}>{success}</div>}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', marginBottom: 0 }}>
        <button onClick={() => { setTab('users'); setError(''); setSuccess(''); }} style={tabBtn('users', 'Users')}>Users ({users.length})</button>
        <button onClick={() => { setTab('roles'); setError(''); setSuccess(''); }} style={tabBtn('roles', 'Roles')}>Roles ({roles.length})</button>
      </div>

      {/* ── USERS TAB ── */}
      {tab === 'users' && (
        <div style={{ border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 var(--radius) var(--radius) var(--radius)', background: 'var(--color-surface)', padding: '1.25rem' }}>
          {/* Create User Form */}
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" onClick={() => { setForm({ email: '', password: '', full_name: '', role: form.role }); setShowUserForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Create User</button>
          </div>
          <Modal isOpen={showUserForm} onClose={() => setShowUserForm(false)} title="Create New User" width="600px">
            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required style={inputStyle} placeholder="user@pspba.org" />
                </div>
                <div>
                  <label style={labelStyle}>Password * (min 8)</label>
                  <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={8} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} style={inputStyle} placeholder="Jane Doe" />
                </div>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} style={inputStyle}>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Creating…' : 'Create User'}</button>
            </form>
          </Modal>

          {/* Users Table */}
          <h2 style={{ margin: '1.5rem 0 0.75rem', fontSize: '1.05rem' }}>All Users ({users.length})</h2>
          {users.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No users yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Email</th>
                    <th style={{ padding: '0.5rem' }}>Role</th>
                    <th style={{ padding: '0.5rem' }}>Joined</th>
                    <th style={{ padding: '0.5rem' }}>Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{u.full_name || '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{u.email}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.15rem 0.55rem',
                          borderRadius: '10px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: u.role === 'admin' ? '#2d5a3d' : 'var(--color-bg)',
                          color: u.role === 'admin' ? '#fff' : 'var(--color-text)',
                          textTransform: 'capitalize',
                        }}>
                          {(u.role || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          style={{ padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ROLES TAB ── */}
      {tab === 'roles' && (
        <div style={{ border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 var(--radius) var(--radius) var(--radius)', background: 'var(--color-surface)', padding: '1.25rem' }}>
          {/* Create Role Form */}
          <div style={{ marginBottom: '1rem' }}>
            <button type="button" onClick={() => { setRoleForm({ name: '', description: '' }); setShowRoleForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Create Role</button>
          </div>
          <Modal isOpen={showRoleForm} onClose={() => setShowRoleForm(false)} title="Create New Role" width="600px">
            <form onSubmit={handleCreateRole}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '0.75rem', alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Role Name *</label>
                  <input type="text" value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} required style={inputStyle} placeholder="e.g. field_monitor" />
                </div>
                <div>
                  <label style={labelStyle}>Description</label>
                  <input type="text" value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="What can this role do?" />
                </div>
                <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Creating…' : 'Create Role'}</button>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                Role names are auto-formatted (lowercase, underscores). E.g. &quot;Case Reporting&quot; becomes &quot;case_reporting&quot;.
              </p>
            </form>
          </Modal>

          {/* Roles List */}
          <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>All Roles ({roles.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {roles.map((r) => {
              const userCount = users.filter((u) => u.role === r.name).length;
              return (
                <div key={r.id} style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <strong style={{ textTransform: 'capitalize', fontSize: '0.95rem' }}>{r.name.replace(/_/g, ' ')}</strong>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      padding: '0.1rem 0.5rem', borderRadius: '10px',
                      background: userCount > 0 ? 'var(--color-primary)' : 'var(--color-border)',
                      color: userCount > 0 ? '#fff' : 'var(--color-text-muted)',
                    }}>{userCount} user{userCount !== 1 ? 's' : ''}</span>
                  </div>
                  {r.description && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.description}</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>ID: {r.name}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
