import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function NewsletterSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/website/admin/newsletter-subscribers`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setSubscribers)
      .catch(() => setSubscribers([]))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    const header = 'email,subscribed_at\n';
    const rows = subscribers.map((s) => `${s.email},${s.subscribed_at || ''}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Newsletter subscribers</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {subscribers.length > 0 && (
            <button type="button" onClick={exportCsv} style={{ padding: '0.5rem 1rem', border: '1px solid var(--color-border)', background: 'var(--color-surface)', borderRadius: 'var(--radius)', cursor: 'pointer' }}>Export CSV</button>
          )}
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
        </div>
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Emails subscribed via the contact page newsletter form.</p>
      {subscribers.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No subscribers yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {subscribers.map((s) => (
            <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', marginBottom: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
              <span>{s.email}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{s.subscribed_at ? new Date(s.subscribed_at).toLocaleDateString() : '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
