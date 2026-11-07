import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const HERO_IMG = 'hero-galleries.jpg';
const PAGE_SIZE = 15;

export function GalleriesPage() {
  const { t } = useTranslation();
  const [galleries, setGalleries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchGalleries = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (query.trim()) params.set('search', query.trim());
    fetch(`${API}/website/galleries?${params}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => { setGalleries(d.rows || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { fetchGalleries(); }, [fetchGalleries]);

  const handleSearch = (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => { setQuery(val); setPage(0); }, 350);
    setSearchTimeout(t);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero Banner */}
      <section
        style={{
          position: 'relative', width: '100%', height: 'min(35vh, 280px)', minHeight: 200,
          backgroundImage: `url(${imageUrl(HERO_IMG)})`, backgroundSize: 'cover', backgroundPosition: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), rgba(0,0,0,0.6))' }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1rem' }}>
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>Photo Galleries</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            Visual stories from PSPBA's peacebuilding activities
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* Search + Count */}
        <div style={{ marginTop: '2rem', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
            {total > 0 ? `${total} ${total === 1 ? t('galleries.gallery') : t('galleries.galleries_plural')}` : ''}
          </p>
          <div style={{ position: 'relative', minWidth: 220, flex: '0 1 360px' }}>
            <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="search"
              placeholder={t('galleries.search_placeholder')}
              defaultValue={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                fontSize: '0.9rem', background: 'var(--color-surface)', color: 'var(--color-text)',
                outline: 'none', boxShadow: 'var(--shadow)',
              }}
            />
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('galleries.loading')}</div>
        ) : galleries.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px dashed var(--color-border)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
              {query ? t('galleries.no_match') : t('galleries.no_galleries')}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('galleries.check_back')}</p>
          </div>
        ) : (
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {galleries.map((g, idx) => (
              <Link key={g.id} to={`/galleries/${g.slug}`} className="gallery-card" style={{
                display: 'block', position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden',
                textDecoration: 'none', color: 'inherit', boxShadow: 'var(--shadow)', transition: 'transform 0.25s, box-shadow 0.25s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #2d5a3d, #1a3d28)', overflow: 'hidden', position: 'relative' }}>
                  {g.cover_image_path ? (
                    <img src={imageUrl(g.cover_image_path)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                      onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                      onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  )}
                  <div className="gallery-overlay" style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '1.25rem',
                  }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600, color: 'white', textShadow: '0 1px 4px rgba(0,0,0,0.4)', lineHeight: 1.3 }}>{g.title}</h3>
                    {g.description && (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{g.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="gallery" />

        {/* CTA */}
        {total > 0 && (
          <section style={{ marginTop: '2rem', padding: '2rem 1.5rem', background: 'var(--color-primary)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 0.5rem', color: 'white', fontSize: '1.25rem', fontWeight: 700 }}>{t('galleries.see_more')}</h2>
            <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem' }}>{t('galleries.see_more_text')}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/news" style={{ display: 'inline-block', padding: '0.55rem 1.25rem', background: 'white', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('galleries.news_stories')}</Link>
              <Link to="/events" style={{ display: 'inline-block', padding: '0.55rem 1.25rem', border: '2px solid white', color: 'white', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('galleries.events')}</Link>
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 560px) { .gallery-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
