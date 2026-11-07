import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function ContactMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/website/admin/contact-messages`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Contact messages</h1>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
      </div>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Messages submitted via the public contact form.</p>
      {messages.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No messages yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {messages.map((m) => (
            <li key={m.id} style={{ background: 'var(--color-surface)', padding: '1rem', marginBottom: '0.75rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong>{m.name}</strong>
                  <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{m.email}</span>
                  {m.subject && <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Subject: {m.subject}</div>}
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{new Date(m.created_at).toLocaleString()}</div>
                </div>
              </div>
              <p style={{ margin: '0.75rem 0 0', whiteSpace: 'pre-wrap' }}>{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
