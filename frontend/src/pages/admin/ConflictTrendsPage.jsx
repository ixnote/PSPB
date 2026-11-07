import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function ConflictTrendsPage() {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    fetch(`${API}/conflict/trends?${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setTrends)
      .catch(() => setTrends({ byLga: [], byIntensity: [], triggers: [] }))
      .finally(() => setLoading(false));
  }, [from, to]);

  if (loading && !trends) return <div className="container" style={{ padding: '2rem' }}>Loading trends…</div>;

  const data = trends || { byLga: [], byIntensity: [], triggers: [] };

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Conflict trend analysis</h1>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
      </div>

      <section style={{ marginBottom: '1rem' }}>
        <label style={{ marginRight: '0.5rem' }}>From:</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ marginRight: '1rem', padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
        <label style={{ marginRight: '0.5rem' }}>To:</label>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: '0.4rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
        <section style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>By LGA</h2>
          {data.byLga?.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No data</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.byLga?.slice(0, 10).map((r) => (
                <li key={r.lga} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{r.lga}</span>
                  <strong>{r.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>By intensity</h2>
          {data.byIntensity?.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No data</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.byIntensity?.map((r) => (
                <li key={r.intensity_level} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{r.intensity_level}</span>
                  <strong>{r.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1rem' }}>Triggers</h2>
          {data.triggers?.length === 0 ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No data</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.triggers?.slice(0, 10).map((r) => (
                <li key={r.trigger_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid var(--color-border)' }}>
                  <span>{r.trigger_name}</span>
                  <strong>{r.count}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
