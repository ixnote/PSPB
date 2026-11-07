import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const params = filterType ? `?type=${encodeURIComponent(filterType)}` : '';
    fetch(`${API}/applications/admin${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [filterType]);

  async function updateStatus(id, status) {
    try {
      const res = await fetch(`${API}/applications/admin/${id}`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
      if (selected?.id === id) setSelected((s) => (s ? { ...s, status } : null));
    } catch (_) {}
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Applications</h1>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
      </div>

      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Volunteer, intern, and consultant applications. New submissions appear here.</p>

      <section style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem' }}>Filter:</label>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
          <option value="">All</option>
          <option value="volunteer">Volunteer</option>
          <option value="intern">Intern</option>
          <option value="consultant">Consultant</option>
        </select>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>List</h2>
          {applications.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>No applications yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {applications.map((a) => (
                <li
                  key={a.id}
                  style={{
                    background: 'var(--color-surface)',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow)',
                    borderLeft: selected?.id === a.id ? '4px solid var(--color-primary)' : '4px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{a.name}</strong> · {a.type}
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{a.email} · {new Date(a.created_at).toLocaleString()}</div>
                    </div>
                    <button type="button" onClick={() => setSelected(a)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>View</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <div style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0 }}>Application #{selected.id}</h3>
              <button type="button" onClick={() => setSelected(null)} style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Close</button>
            </div>
            <p><strong>Type:</strong> {selected.type}</p>
            <p><strong>Name:</strong> {selected.name}</p>
            <p><strong>Email:</strong> {selected.email}</p>
            {selected.phone && <p><strong>Phone:</strong> {selected.phone}</p>}
            <p><strong>Received:</strong> {new Date(selected.created_at).toLocaleString()}</p>
            <p><strong>Status:</strong> {selected.status}</p>
            {selected.data && typeof selected.data === 'object' && (
              <div style={{ marginTop: '0.75rem' }}>
                <strong>Details:</strong>
                <div style={{ margin: '0.25rem 0 0', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.85rem' }}>
                  {Object.entries(selected.data)
                    .filter(([key]) => key !== 'attachmentName')
                    .map(([key, value]) => (
                      <div key={key} style={{ marginBottom: '0.4rem', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:
                        </span>{' '}
                        <span style={{ color: 'var(--color-text)' }}>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {selected.attachment_path && (
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API}/applications/admin/${selected.id}/download`, { headers: getAuthHeaders() });
                      if (!res.ok) throw new Error('Download failed');
                      const blob = await res.blob();
                      const filename = selected.data?.attachmentName || `${selected.name}_CV`;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = filename;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    } catch (_) {
                      alert('Failed to download file.');
                    }
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.9rem',
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download CV {selected.data?.attachmentName ? `(${selected.data.attachmentName})` : ''}
                </button>
              </div>
            )}
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => updateStatus(selected.id, 'shortlisted')} style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--color-primary)', background: 'transparent', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600 }}>Shortlist</button>
              <button type="button" onClick={() => updateStatus(selected.id, 'rejected')} style={{ padding: '0.4rem 0.8rem', border: '1px solid var(--color-error)', background: 'transparent', color: 'var(--color-error)', borderRadius: 'var(--radius)' }}>Reject</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
