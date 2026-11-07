import { useState, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/*
 * Role → route permission map.
 * Each role lists the route prefixes it can access.
 * 'admin' has access to everything so isn't listed — it's handled with a wildcard.
 */
const ROLE_ROUTES = {
  admin: '*', // everything
  merl: [
    '/admin/dashboard',
    '/admin/conflict',
    '/admin/documents',
    '/admin/content/pages',
    '/admin/content/news',
    '/admin/content/events',
    '/admin/content/galleries',
    '/admin/content/videos',
    '/admin/content/approvals',
    '/admin/applications',
    '/admin/document-requests',
    '/admin/content/contact-messages',
    '/admin/content/newsletter-subscribers',
    '/admin/change-password',
  ],
  programme: [
    '/admin/dashboard',
    '/admin/conflict',
    '/admin/documents',
    '/admin/content/pages',
    '/admin/content/news',
    '/admin/content/events',
    '/admin/content/galleries',
    '/admin/content/videos',
    '/admin/content/approvals',
    '/admin/applications',
    '/admin/document-requests',
    '/admin/change-password',
  ],
  strategic_communications: [
    '/admin/dashboard',
    '/admin/content/pages',
    '/admin/content/news',
    '/admin/content/events',
    '/admin/content/galleries',
    '/admin/content/videos',
    '/admin/content/approvals',
    '/admin/documents',
    '/admin/applications',
    '/admin/document-requests',
    '/admin/content/contact-messages',
    '/admin/content/newsletter-subscribers',
    '/admin/change-password',
  ],
  ict: [
    '/admin/dashboard',
    '/admin/documents',
    '/admin/applications',
    '/admin/change-password',
  ],
  case_reporting: [
    '/admin/dashboard',
    '/admin/conflict/incidents',
    '/admin/conflict/map',
    '/admin/change-password',
  ],
  field_officer: [
    '/admin/dashboard',
    '/admin/conflict/incidents',
    '/admin/conflict/map',
    '/admin/change-password',
  ],
  analyst: [
    '/admin/dashboard',
    '/admin/conflict/incidents',
    '/admin/conflict/actors',
    '/admin/conflict/map',
    '/admin/conflict/trends',
    '/admin/documents',
    '/admin/change-password',
  ],
  viewer: [
    '/admin/dashboard',
    '/admin/change-password',
  ],
};

function canAccess(role, route) {
  if (!role) return false;
  if (role === 'admin') return true;
  const allowed = ROLE_ROUTES[role];
  if (!allowed) return false;
  if (allowed === '*') return true;
  return allowed.some((prefix) => route.startsWith(prefix));
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/admin/content/news', label: 'News & Blog' },
      { to: '/admin/content/events', label: 'Events' },
      { to: '/admin/content/galleries', label: 'Galleries' },
      { to: '/admin/content/videos', label: 'Videos' },
      { to: '/admin/content/team', label: 'Team Members' },
      { to: '/admin/content/approvals', label: 'Approvals' },
    ],
  },
  {
    label: 'Conflict & Peace',
    items: [
      { to: '/admin/conflict/incidents', label: 'Incidents' },
      { to: '/admin/conflict/actors', label: 'Peace Actors' },
      { to: '/admin/conflict/map', label: 'Conflict Map' },
      { to: '/admin/conflict/trends', label: 'Trend Analysis' },
    ],
  },
  {
    label: 'Knowledge',
    items: [
      { to: '/admin/documents', label: 'Documents' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { to: '/admin/applications', label: 'Applications' },
      { to: '/admin/document-requests', label: 'Document Requests' },
      { to: '/admin/content/contact-messages', label: 'Messages' },
      { to: '/admin/content/newsletter-subscribers', label: 'Newsletter' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users & Roles' },
      { to: '/admin/departments', label: 'Units' },
    ],
  },
];

const linkBase = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.45rem 0.75rem',
  borderRadius: 'var(--radius)',
  textDecoration: 'none',
  color: 'var(--color-text)',
  fontSize: '0.9rem',
  transition: 'background 0.15s',
};

const linkActive = {
  ...linkBase,
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 600,
};

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const ROLE_COLORS = {
  admin: '#dc2626',
  merl: '#7c3aed',
  programme: '#2563eb',
  strategic_communications: '#059669',
  ict: '#0891b2',
  case_reporting: '#ea580c',
  field_officer: '#d97706',
  analyst: '#4f46e5',
  viewer: '#64748b',
};

export function AdminLayout() {
  const { user, token, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isLogin = location.pathname === '/admin/login';
  const [showProfile, setShowProfile] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState(() => {
    const initial = {};
    NAV_SECTIONS.forEach((s) => { initial[s.label] = true; });
    return initial;
  });

  const toggleSection = useCallback((label) => {
    setCollapsedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const role = user?.role || '';

  // Don't show sidebar on login page
  if (isLogin || !token) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Outlet />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const roleColor = ROLE_COLORS[role] || '#64748b';
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'User';
  const initials = getInitials(displayName);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        minWidth: '240px',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>
        {/* Logo / Brand */}
        <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
          <NavLink to="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/logo.png" alt="PSPBA Logo" style={{ height: '36px', width: 'auto' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-primary)', lineHeight: 1.2 }}>PSPBA</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Admin Console</div>
            </div>
          </NavLink>
        </div>

        {/* Nav sections — role-filtered, collapsible */}
        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => canAccess(role, item.to));
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedSections[section.label];
            return (
              <div key={section.label} style={{ marginBottom: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => toggleSection(section.label)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '0.45rem 0.75rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--color-text-muted)',
                    borderRadius: 'var(--radius)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  {section.label}
                  <span style={{ fontSize: '0.65rem', transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}>
                    &#9654;
                  </span>
                </button>
                <div style={{
                  overflow: 'hidden',
                  maxHeight: isCollapsed ? '0' : `${visibleItems.length * 40}px`,
                  transition: 'max-height 0.25s ease',
                }}>
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      style={({ isActive }) => isActive ? linkActive : linkBase}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: 0 }}>
          {/* Profile toggle button */}
          <button
            onClick={() => setShowProfile((p) => !p)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
              padding: '0.75rem', background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {/* Avatar */}
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: `${roleColor}20`, color: roleColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
              border: `2px solid ${roleColor}40`,
            }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>
                {displayName}
              </div>
              <div style={{
                display: 'inline-block', marginTop: '0.15rem',
                padding: '0.05rem 0.4rem', borderRadius: '999px',
                fontSize: '0.65rem', fontWeight: 600, textTransform: 'capitalize',
                background: `${roleColor}15`, color: roleColor,
                letterSpacing: '0.3px',
              }}>
                {role.replace(/_/g, ' ')}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
              {showProfile ? '▲' : '▼'}
            </span>
          </button>

          {/* Expanded profile menu */}
          {showProfile && (
            <div style={{ padding: '0 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {user?.email && (
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', padding: '0.2rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.35rem' }}>
                <NavLink
                  to="/admin/change-password"
                  onClick={() => setShowProfile(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.5rem', borderRadius: 'var(--radius)',
                    textDecoration: 'none', color: 'var(--color-text)', fontSize: '0.82rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  Change Password
                </NavLink>
                <NavLink
                  to="/"
                  onClick={() => setShowProfile(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.4rem 0.5rem', borderRadius: 'var(--radius)',
                    textDecoration: 'none', color: 'var(--color-text)', fontSize: '0.82rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  View Public Site
                </NavLink>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem', marginTop: '0.35rem',
                  background: '#fef2f2', border: '1px solid #fecaca',
                  borderRadius: 'var(--radius)', cursor: 'pointer',
                  color: '#dc2626', fontSize: '0.82rem', fontWeight: 600,
                  width: '100%', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

// Export for use by DashboardPage and other components
export { canAccess };
