import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

const STATUS_COLORS = {
  pending: { bg: 'rgba(234,179,8,0.15)', color: '#b45309' },
  approved: { bg: 'rgba(34,197,94,0.15)', color: '#16a34a' },
  rejected: { bg: 'rgba(239,68,68,0.15)', color: '#dc2626' },
};

export function DocumentRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    return fetch(`${API}/website/admin/document-requests?${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then(setRequests);
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API}/website/admin/document-requests/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading requests...</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ margin: 0 }}>Document Requests</h1>
          <span style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)', color: 'var(--color-text-muted)', fontWeight: 600 }}>{requests.length}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>}

      {requests.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <p style={{ margin: 0 }}>No document requests found.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>ID</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Document</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Reason</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Date</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => {
                const colors = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>#{r.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}>{r.document_title || `Doc #${r.document_id}`}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{r.name}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem' }}>{r.email}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.reason}>{r.reason || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius)', background: colors.bg, color: colors.color, textTransform: 'capitalize' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          <button type="button" onClick={() => updateStatus(r.id, 'approved')} title="Approving will email the document to the requester" style={{ padding: '0.3rem 0.6rem', border: '1px solid #16a34a', background: 'transparent', color: '#16a34a', borderRadius: 'var(--radius)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>Approve & Send</button>
                          <button type="button" onClick={() => updateStatus(r.id, 'rejected')} style={{ padding: '0.3rem 0.6rem', border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', borderRadius: 'var(--radius)', fontSize: '0.8rem', cursor: 'pointer' }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
