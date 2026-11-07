import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function ApprovalsPage() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    fetch(`${API}/website/admin/approvals`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setPending)
      .catch((e) => setError(e.message));

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, []);

  async function resolve(id, status) {
    setError('');
    try {
      const res = await fetch(`${API}/website/admin/approvals/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPending((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Content approvals</h1>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Pending publication requests. Admin can approve or reject.</p>
      {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>}
      {pending.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No pending approvals.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {pending.map((a) => (
            <li key={a.id} style={{ background: 'var(--color-surface)', padding: '1rem', marginBottom: '0.75rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <strong>{a.entity_type}</strong> #{a.entity_id}
                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>Requested by {a.requested_by_email || '—'} · {new Date(a.created_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => resolve(a.id, 'approved')} style={{ padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>Approve</button>
                <button type="button" onClick={() => resolve(a.id, 'rejected')} style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', borderRadius: 'var(--radius)' }}>Reject</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
