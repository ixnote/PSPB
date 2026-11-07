import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SOCIALS = [
  {
    label: 'X (Twitter)',
    href: 'https://x.com/plspeaceagency',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/plateaupeacebuildingagency/',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/channel/UCeGhW8-X5fDcjTrpiFiH8Ig/videos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    ),
  },
];

const socialLinkStyle = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '34px', height: '34px', borderRadius: '50%',
  background: 'var(--color-bg)', color: 'var(--color-text-muted)',
  transition: 'background 0.2s, color 0.2s',
};

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer
      style={{
        marginTop: 'auto',
        padding: '1.5rem 0',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        color: 'var(--color-text-muted)',
        fontSize: '0.9rem',
      }}
    >
      <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              title={s.label}
              style={socialLinkStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              {s.icon}
            </a>
          ))}
        </div>
        <span>
          <Link to="/contact">{t('footer.contact')}</Link>
          {' · '}
          <Link to="/apply">{t('footer.apply')}</Link>
        </span>
      </div>
    </footer>
  );
}
