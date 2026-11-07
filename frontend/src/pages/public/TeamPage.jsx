import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const HERO_IMG = 'hero-team.jpg';
const PAGE_SIZE = 15;

const CATEGORY_VALUES = ['', 'management', 'board', 'advisory', 'staff'];
const CATEGORY_KEYS = ['all', 'management', 'board', 'advisory', 'staff'];

function getInitials(fullName) {
  if (!fullName || typeof fullName !== 'string') return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getPhotoUrl(photoPath) {
  if (!photoPath) return null;
  if (photoPath.startsWith('http')) return photoPath;
  return imageUrl(photoPath) || `/api/website/files/${photoPath}`;
}

export function TeamPage() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);

  const fetchTeam = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (category) params.set('category', category);
    fetch(`${API}/website/team?${params}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load team'))))
      .then((d) => { setMembers(d.rows || []); setTotal(d.total || 0); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, page]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleCategory = (val) => { setCategory(val); setPage(0); };
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero Banner */}
      <section
        style={{
          position: 'relative', width: '100%', height: 'min(40vh, 320px)', minHeight: 240,
          backgroundImage: `url(${imageUrl(HERO_IMG)})`, backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1rem', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{t('team.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: 'clamp(1rem, 2vw, 1.2rem)', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            {t('team.subtitle')}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* Category Tabs */}
        <section style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {CATEGORY_VALUES.map((val, i) => (
              <button key={val || 'all'} type="button" onClick={() => handleCategory(val)} style={{
                padding: '0.5rem 1.25rem',
                border: category === val ? 'none' : '1px solid var(--color-border)',
                borderRadius: '999px', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
                background: category === val ? 'var(--color-primary)' : 'var(--color-surface)',
                color: category === val ? 'white' : 'var(--color-text)',
                boxShadow: category === val ? 'var(--shadow)' : 'none',
              }}>{t(`team.${CATEGORY_KEYS[i]}`)}</button>
            ))}
          </div>
        </section>

        {/* Team Member Cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }} className="team-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('team.loading')}</div>
          ) : error ? (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{error}</div>
          ) : members.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px dashed var(--color-border)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>{t('team.no_team')}</p>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>{t('team.refreshing')}</p>
            </div>
          ) : (
            members.map((member) => {
              const photoSrc = getPhotoUrl(member.photo_path);
              const initials = getInitials(member.full_name);
              return (
                <div key={member.id} style={{
                  background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
                  overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                >
                  <div style={{
                    width: '100%', height: 240,
                    background: photoSrc ? undefined : 'linear-gradient(135deg, #2d5a3d 0%, #3d7a5d 100%)',
                    overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius) var(--radius) 0 0',
                  }}>
                    {photoSrc ? (
                      <img src={photoSrc} alt={member.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{initials}</span>
                    )}
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{member.full_name}</h3>
                    {member.title && <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{member.title}</p>}
                    {member.department && (
                      <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 500, background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', marginBottom: '0.5rem' }}>{member.department}</span>
                    )}
                    {member.bio && (
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{member.bio}</p>
                    )}
                    {member.email && (
                      <a href={`mailto:${member.email}`} style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none' }}>{member.email}</a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="member" />

        {/* CTA */}
        <section style={{ marginTop: '2rem', padding: '2.5rem 2rem', background: 'var(--color-primary)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.75rem', color: 'white', fontWeight: 700 }}>{t('team.join_title')}</h2>
          <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.95)', fontSize: '1.05rem', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            {t('team.join_text')}
          </p>
          <Link to="/apply" style={{ display: 'inline-block', padding: '0.65rem 1.5rem', background: 'white', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('team.apply_now')}</Link>
        </section>
      </div>

      <style>{`
        @media (max-width: 900px) { .team-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .team-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
