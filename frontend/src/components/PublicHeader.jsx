import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function useNav() {
  const { t } = useTranslation();
  return [
    { to: '/', label: t('header.home') },
    {
      label: t('header.about'),
      children: [
        { to: '/about', label: t('header.about') },
        { to: '/our-work', label: t('header.our_work') },
        { to: '/team', label: t('header.team') },
      ],
    },
    {
      label: t('header.news_events'),
      children: [
        { to: '/news', label: t('header.news') },
        { to: '/events', label: t('header.events') },
        { to: '/galleries', label: t('header.galleries') },
        { to: '/videos', label: t('header.videos') },
      ],
    },
    { to: '/repository', label: t('header.documents') },
    {
      label: t('header.databases'),
      children: [
        { to: '/conflict-data', label: t('header.conflict_attacks') },
        { to: '/peacebuilding-actors', label: t('header.peacebuilding_actors') },
        { to: '/map', label: t('header.conflict_map') },
      ],
    },
    { to: '/partners', label: t('header.partners') },
    { to: '/contact', label: t('header.contact') },
    { to: '/apply', label: t('header.apply') },
    { to: '/application-status', label: t('header.check_status') },
  ];
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'ha', label: 'HA' },
  ];
  return (
    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: '0.5rem' }}>
      {langs.map((l, i) => (
        <span key={l.code}>
          <button
            type="button"
            onClick={() => i18n.changeLanguage(l.code)}
            style={{
              padding: '0.25rem 0.45rem',
              border: 'none',
              background: i18n.language === l.code ? 'var(--color-primary)' : 'transparent',
              color: i18n.language === l.code ? 'white' : 'var(--color-text-muted)',
              borderRadius: 'var(--radius)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            {l.label}
          </button>
          {i < langs.length - 1 && <span style={{ color: 'var(--color-border)', fontSize: '0.7rem' }}>|</span>}
        </span>
      ))}
    </div>
  );
}

function NavItem({ item, onClose, pathname }) {
  if (item.to) {
    const isActive = pathname === item.to;
    return (
      <li>
        <NavLink to={item.to} end={item.to === '/'} className={isActive ? 'active' : ''} onClick={onClose}>
          {item.label}
        </NavLink>
      </li>
    );
  }
  const [expanded, setExpanded] = useState(false);
  const hasActiveChild = item.children?.some((c) => c.to && pathname === c.to);
  return (
    <li className="nav-dropdown">
      <button
        type="button"
        className={`nav-trigger ${hasActiveChild ? 'active' : ''}`}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        {item.label}
        <span className="nav-chevron">{expanded ? '−' : '+'}</span>
      </button>
      {item.children && (
        <ul className={`nav-sub ${expanded ? 'open' : ''}`}>
          {item.children.map((child) => (
            <li key={child.to}>
              <NavLink to={child.to} className={pathname === child.to ? 'active' : ''} onClick={onClose}>
                {child.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [hoverDropdown, setHoverDropdown] = useState(null);
  const location = useLocation();
  const pathname = location.pathname;
  const nav = useNav();

  return (
    <header
      style={{
        background: 'var(--color-surface)',
        boxShadow: 'var(--shadow)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div className="container header-inner">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
          <img src="/logo.png" alt="PSPBA Logo" style={{ height: '40px', width: 'auto' }} />
          <span>PSPBA</span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? '✕' : '☰'}
        </button>
        <nav
          role="navigation"
          aria-label="Main"
          className={`main-nav ${open ? 'open' : ''}`}
        >
          <ul className="nav-list nav-desktop">
            {nav.map((item) => (
              item.to ? (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => isActive ? 'active' : ''}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ) : (
                <li
                  key={item.label}
                  className="nav-dropdown desktop"
                  onMouseEnter={() => setHoverDropdown(item.label)}
                  onMouseLeave={() => setHoverDropdown(null)}
                >
                  <button
                    type="button"
                    className={`nav-trigger desktop ${item.children?.some((c) => c.to && pathname === c.to) ? 'active' : ''}`}
                    aria-haspopup="true"
                    aria-expanded={hoverDropdown === item.label}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden><path d="M0 0l5 6 5-6H0z" /></svg>
                  </button>
                  {item.children && (
                    <ul className={`nav-sub desktop ${hoverDropdown === item.label ? 'open' : ''}`}>
                      {item.children.map((child) => (
                        <li key={child.to}>
                          <Link to={child.to} onClick={() => setOpen(false)}>{child.label}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            ))}
          </ul>
          <ul className="nav-list nav-mobile">
            {nav.map((item) => (
              <NavItem key={item.to || item.label} item={item} onClose={() => setOpen(false)} pathname={pathname} />
            ))}
          </ul>
        </nav>
        <div className="lang-switcher"><LanguageSwitcher /></div>
      </div>
      <style>{`
        .header-inner { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 3.5rem; flex-wrap: nowrap; }
        .logo { font-weight: 700; font-size: 1.15rem; color: var(--color-primary); text-decoration: none; margin-right: 1rem; flex-shrink: 0; }
        .logo span { display: none; }
        @media (min-width: 480px) { .logo span { display: inline; } }
        .menu-toggle { padding: 0.5rem; border: none; background: none; flex-shrink: 0; }
        .lang-switcher { position: absolute; right: 3rem; top: 50%; transform: translateY(-50%); z-index: 2; flex-shrink: 0; }
        .main-nav { position: absolute; top: 100%; left: 0; right: 0; background: var(--color-surface); box-shadow: var(--shadow); display: none; z-index: 20; }
        .main-nav.open { display: block; }
        .main-nav ul { list-style: none; margin: 0; padding: 0.5rem 0; }
        .main-nav li a, .main-nav .nav-trigger { display: block; padding: 0.6rem 1rem; color: var(--color-text); text-align: left; width: 100%; background: none; border: none; font: inherit; cursor: pointer; }
        .main-nav li a.active, .main-nav .nav-trigger.active { color: var(--color-primary); font-weight: 600; }
        .main-nav .nav-trigger { display: flex; justify-content: space-between; align-items: center; }
        .main-nav .nav-chevron { color: var(--color-text-muted); font-size: 1.1rem; }
        .main-nav .nav-sub { list-style: none; margin: 0; padding: 0; background: var(--color-bg); max-height: 0; overflow: hidden; transition: max-height 0.2s; }
        .main-nav .nav-sub.open { max-height: 12rem; }
        .main-nav .nav-sub li a { padding-left: 1.5rem; }
        .main-nav .nav-desktop { display: none; }
        .main-nav .nav-mobile { display: block; }

        @media (min-width: 768px) {
          .menu-toggle { display: none; }
          .lang-switcher { position: static; transform: none; flex-shrink: 0; }
          .main-nav { position: static; display: flex !important; box-shadow: none; flex: 1; min-width: 0; overflow: visible; }
          .main-nav .nav-mobile { display: none; }
          .main-nav .nav-desktop { display: flex; flex-wrap: nowrap; gap: 0; padding: 0; align-items: center; white-space: nowrap; }
          .main-nav .nav-list li a { padding: 0.5rem 0.5rem; font-size: 0.82rem; white-space: nowrap; }
          .nav-dropdown.desktop { position: relative; }
          .nav-trigger.desktop { width: auto; padding: 0.5rem 0.5rem; font-size: 0.82rem; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; }
          .nav-trigger.desktop svg { transition: transform 0.2s; }
          .nav-dropdown.desktop:hover .nav-trigger.desktop svg { transform: rotate(180deg); }
          .nav-sub.desktop {
            position: absolute;
            top: 100%;
            left: 0;
            min-width: 160px;
            background: var(--color-surface);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: var(--radius);
            padding: 0.5rem 0;
            margin-top: 0.25rem;
            max-height: none;
            overflow: visible;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-4px);
            transition: opacity 0.2s, visibility 0.2s, transform 0.2s;
          }
          .nav-sub.desktop.open { opacity: 1; visibility: visible; transform: translateY(0); white-space: normal; }
          .nav-sub.desktop li a { padding: 0.5rem 1rem; font-size: 0.85rem; white-space: normal; }
        }
        @media (min-width: 1100px) {
          .main-nav .nav-list li a { padding: 0.5rem 0.65rem; font-size: 0.88rem; }
          .nav-trigger.desktop { padding: 0.5rem 0.65rem; font-size: 0.88rem; }
        }
      `}</style>
    </header>
  );
}
