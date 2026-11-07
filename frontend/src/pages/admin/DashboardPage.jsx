import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '../../hooks/useAuth';
import { canAccess } from '../../layouts/AdminLayout';

const API = '/api';
const INTENSITY_COLORS = { low: '#86efac', medium: '#fde047', high: '#f97316', critical: '#dc2626' };

/* ── Stat Card ── */
function StatCard({ label, value, to, color }) {
  const content = (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      padding: '1rem 1.15rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      transition: 'box-shadow 0.2s',
      cursor: to ? 'pointer' : 'default',
      borderLeft: `4px solid ${color || 'var(--color-primary)'}`,
      minHeight: '70px',
    }}>
      <div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{value ?? '–'}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{content}</Link> : content;
}

/* ── Horizontal bar chart ── */
function HorizontalBar({ data, colorMap }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '100px', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{d.label}</span>
          <div style={{ flex: 1, height: '18px', background: 'var(--color-bg)', borderRadius: '9px', overflow: 'hidden' }}>
            <div style={{
              width: `${(d.count / max) * 100}%`,
              height: '100%',
              background: colorMap?.[d.label] || 'var(--color-primary)',
              borderRadius: '9px',
              minWidth: d.count > 0 ? '18px' : 0,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <span style={{ width: '28px', fontSize: '0.8rem', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Donut / ring chart (pure CSS) ── */
function DonutChart({ data, colorMap, size = 130 }) {
  const total = data.reduce((s, d) => s + d.count, 0) || 1;
  let accumulated = 0;
  const segments = data.map((d) => {
    const start = (accumulated / total) * 360;
    accumulated += d.count;
    const end = (accumulated / total) * 360;
    return { ...d, start, end };
  });

  const conicGradient = segments
    .map((s) => `${colorMap?.[s.label] || '#ccc'} ${s.start}deg ${s.end}deg`)
    .join(', ');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `conic-gradient(${conicGradient})`,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '20%', left: '20%', width: '60%', height: '60%',
          borderRadius: '50%', background: 'var(--color-surface)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1.1rem',
        }}>{total}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: colorMap?.[d.label] || '#ccc', flexShrink: 0 }} />
            <span style={{ textTransform: 'capitalize' }}>{d.label}: <strong>{d.count}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* All possible stat cards — each tagged with the route it links to */
const ALL_STAT_CARDS = [
  { label: 'Conflict Incidents', key: 'incidents', to: '/admin/conflict/incidents', color: '#f97316' },
  { label: 'Peace Actors', key: 'actors', to: '/admin/conflict/actors', color: '#2d5a3d' },
  { label: 'Documents', key: 'documents', to: '/admin/documents', color: '#4a90d9' },
  { label: 'Published News', key: 'newsPublished', to: '/admin/content/news', color: '#c4a35a' },
  { label: 'Published Events', key: 'eventsPublished', to: '/admin/content/events', color: '#9b59b6' },
  { label: 'Galleries', key: 'galleries', to: '/admin/content/galleries', color: '#1abc9c' },
  { label: 'Videos', key: 'videos', to: '/admin/content/videos', color: '#e11d48' },
  { label: 'Applications', key: 'applications', to: '/admin/applications', color: '#e67e22' },
  { label: 'Messages', key: 'contactMessages', to: '/admin/content/contact-messages', color: '#e74c3c' },
  { label: 'Subscribers', key: 'newsletterSubscribers', to: '/admin/content/newsletter-subscribers', color: '#3498db' },
  { label: 'Content Pages', key: 'pagesPublished', to: '/admin/content/pages', color: '#8e44ad' },
  { label: 'Users', key: 'users', to: '/admin/users', color: '#2c3e50' },
];

/*
 * Quick actions — each action has a `writeRoles` list.
 * If the user's role is in writeRoles they see the write label; otherwise the view label.
 */
const ALL_QUICK_ACTIONS = [
  { to: '/admin/conflict/incidents', writeLabel: 'Report Incident', viewLabel: 'View Incidents', writeRoles: ['merl', 'programme', 'admin', 'case_reporting', 'field_officer'] },
  { to: '/admin/documents', writeLabel: 'Upload Document', viewLabel: 'Browse Documents', writeRoles: ['merl', 'strategic_communications', 'ict', 'programme', 'admin'] },
  { to: '/admin/content/news', writeLabel: 'Create News Post', viewLabel: 'View News', writeRoles: ['merl', 'strategic_communications', 'programme', 'admin'] },
  { to: '/admin/content/events', writeLabel: 'Add Event', viewLabel: 'View Events', writeRoles: ['merl', 'strategic_communications', 'programme', 'admin'] },
  { to: '/admin/content/galleries', writeLabel: 'New Gallery', viewLabel: 'View Galleries', writeRoles: ['merl', 'strategic_communications', 'programme', 'admin'] },
  { to: '/admin/content/videos', writeLabel: 'Add Video', viewLabel: 'View Videos', writeRoles: ['merl', 'strategic_communications', 'programme', 'admin'] },
  { to: '/admin/conflict/map', writeLabel: 'View Map', viewLabel: 'View Map', writeRoles: [] },
  { to: '/admin/conflict/trends', writeLabel: 'View Trends', viewLabel: 'View Trends', writeRoles: [] },
  { to: '/admin/conflict/actors', writeLabel: 'Manage Actors', viewLabel: 'View Actors', writeRoles: ['merl', 'programme', 'admin'] },
  { to: '/admin/applications', writeLabel: 'Manage Applications', viewLabel: 'View Applications', writeRoles: ['merl', 'programme', 'admin'] },
  { to: '/admin/users', writeLabel: 'Manage Users', viewLabel: 'Manage Users', writeRoles: ['admin'] },
];

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.role || '';

  useEffect(() => {
    fetch(`${API}/dashboard/stats`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading dashboard…</div>;

  const intensityData = stats?.incidentsByIntensity || {};
  const donutData = ['low', 'medium', 'high', 'critical']
    .filter((k) => intensityData[k])
    .map((k) => ({ label: k, count: intensityData[k] }));

  const lgaBarData = (stats?.incidentsByLga || []).map((r) => ({ label: r.lga, count: r.count }));

  const roleBarData = (stats?.usersByRole || []).map((r) => ({ label: r.role.replace(/_/g, ' '), count: r.count }));
  const roleColors = {};
  const palette = ['#2d5a3d', '#c4a35a', '#4a90d9', '#e67e22', '#9b59b6', '#1abc9c', '#e74c3c', '#34495e', '#27ae60'];
  roleBarData.forEach((d, i) => { roleColors[d.label] = palette[i % palette.length]; });

  // Filter stat cards: only show if user can access the linked page
  const visibleStatCards = ALL_STAT_CARDS.filter((card) => canAccess(role, card.to));

  // Filter quick actions: only show if user can access the linked page, and pick the right label
  const visibleQuickActions = ALL_QUICK_ACTIONS
    .filter((action) => canAccess(role, action.to))
    .map((action) => ({
      ...action,
      label: action.writeRoles.includes(role) ? action.writeLabel : action.viewLabel,
    }));

  // Determine which dashboard sections to show based on role
  const canSeeConflict = canAccess(role, '/admin/conflict/incidents');
  const canSeeUsers = canAccess(role, '/admin/users');

  return (
    <div style={{ padding: '1.5rem 1.5rem 3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem' }}>{greeting()}, {user?.fullName || user?.email?.split('@')[0]}</h1>
        <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Here&rsquo;s an overview of the PSPBA platform.
        </p>
      </div>

      {/* Stat Cards Grid — role-filtered */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {visibleStatCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats?.[card.key]}
            to={card.to}
            color={card.color}
          />
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Incident Intensity Donut — only for roles that can see conflict data */}
        {canSeeConflict && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Incidents by Intensity</h3>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} colorMap={INTENSITY_COLORS} />
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No incident data yet.</p>
            )}
          </div>
        )}

        {/* Incidents by LGA bar — only for conflict roles */}
        {canSeeConflict && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Top LGAs by Incidents</h3>
            {lgaBarData.length > 0 ? (
              <HorizontalBar data={lgaBarData} />
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No incident data yet.</p>
            )}
          </div>
        )}

        {/* Users by Role bar — admin only */}
        {canSeeUsers && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Users by Role</h3>
            {roleBarData.length > 0 ? (
              <HorizontalBar data={roleBarData} colorMap={roleColors} />
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No user data.</p>
            )}
          </div>
        )}
      </div>

      {/* Recent Incidents — only for conflict roles */}
      {canSeeConflict && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Incidents</h3>
            <Link to="/admin/conflict/incidents" style={{ fontSize: '0.85rem' }}>View all →</Link>
          </div>
          {(stats?.recentIncidents || []).length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600 }}>LGA</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600 }}>Title</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600 }}>Intensity</th>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentIncidents.map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.4rem 0.5rem' }}>{inc.lga}</td>
                    <td style={{ padding: '0.4rem 0.5rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.title || '—'}</td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      {inc.intensity_level ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 600,
                          background: INTENSITY_COLORS[inc.intensity_level] || '#eee',
                          color: inc.intensity_level === 'critical' || inc.intensity_level === 'high' ? '#fff' : '#333',
                        }}>
                          {inc.intensity_level}
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ padding: '0.4rem 0.5rem', color: 'var(--color-text-muted)' }}>{inc.incident_date ? new Date(inc.incident_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No incidents recorded yet.</p>
          )}
        </div>
      )}

      {/* Quick Actions — role-filtered */}
      {visibleQuickActions.length > 0 && (
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {visibleQuickActions.map((a) => (
              <Link key={a.to} to={a.to} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 0.85rem', background: 'var(--color-bg)',
                borderRadius: 'var(--radius)', border: '1px solid var(--color-border)',
                textDecoration: 'none', color: 'var(--color-text)',
                fontSize: '0.85rem', fontWeight: 500,
                transition: 'background 0.15s, border-color 0.15s',
              }}>
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
