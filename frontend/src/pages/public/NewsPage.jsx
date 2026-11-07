import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const HERO_IMG = 'hero-news.jpg';
const PAGE_SIZE = 15;

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function NewsPage() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchPosts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (query.trim()) params.set('search', query.trim());
    fetch(`${API}/website/news?${params}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => { setPosts(d.rows || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleSearch = (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => { setQuery(val); setPage(0); }, 350);
    setSearchTimeout(t);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const featured = posts.length > 0 && page === 0 && !query ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

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
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {t('news.title')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {t('news.subtitle')}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginTop: '2rem', marginBottom: '2rem', maxWidth: 480 }}>
          <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="search"
            placeholder={t('news.search_placeholder')}
            defaultValue={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.7rem 1rem 0.7rem 2.6rem',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
              fontSize: '0.95rem', background: 'var(--color-surface)', color: 'var(--color-text)',
              outline: 'none', boxShadow: 'var(--shadow)',
            }}
          />
        </div>

        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('news.loading')}</div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px dashed var(--color-border)', marginTop: '2rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
              {query ? t('news.no_match') : t('news.no_news')}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('news.check_back')}</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featured && (
              <Link to={`/news/${featured.slug}`} className="news-featured" style={{
                display: 'grid', gridTemplateColumns: '1fr',
                background: 'var(--color-surface)', borderRadius: 'var(--radius)', overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)', textDecoration: 'none', color: 'inherit',
                marginBottom: '2.5rem', border: '1px solid var(--color-border)', transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ height: 300, overflow: 'hidden', background: 'linear-gradient(135deg, #2d5a3d, #1a3d28)' }}>
                  {featured.featured_image_path ? (
                    <img src={imageUrl(featured.featured_image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  )}
                </div>
                <div style={{ padding: '1.5rem 2rem' }}>
                  <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{t('news.latest')}</span>
                  <h2 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.3 }}>{featured.title}</h2>
                  {featured.excerpt && <p style={{ margin: '0 0 0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '1rem' }}>{featured.excerpt}</p>}
                  {featured.published_at && <time style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{formatDate(featured.published_at)}</time>}
                </div>
              </Link>
            )}

            {/* Post Grid */}
            {rest.length > 0 && (
              <>
                {featured && (
                  <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.25rem', color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem' }}>
                    {query ? t('news.search_results', { count: total }) : t('news.more_stories')}
                  </h2>
                )}
                <div className="news-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                  {rest.map((p, idx) => {
                    const postIdx = featured ? idx + 1 : idx;
                    return (
                    <Link key={p.id} to={`/news/${p.slug}`} style={{
                      display: 'flex', flexDirection: 'column', background: 'var(--color-surface)',
                      borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)',
                      textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ height: 180, overflow: 'hidden', background: 'linear-gradient(135deg, #2d5a3d, #3d7a5d)' }}>
                        {p.featured_image_path ? (
                          <img src={imageUrl(p.featured_image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                        )}
                      </div>
                      <div style={{ padding: '1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.title}</h3>
                        {p.excerpt && <p style={{ margin: '0 0 0.75rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.excerpt}</p>}
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {p.published_at && <time style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formatDate(p.published_at)}</time>}
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{t('news.read_more')}</span>
                        </div>
                      </div>
                    </Link>
                  );
                  })}
                </div>
              </>
            )}

            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="post" />
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .news-featured { grid-template-columns: 1.2fr 1fr !important; }
          .news-featured > div:first-child { height: auto !important; min-height: 280px; }
        }
        @media (max-width: 900px) { .news-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 600px) { .news-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
