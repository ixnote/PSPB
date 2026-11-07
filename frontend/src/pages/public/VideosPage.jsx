import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const PAGE_SIZE = 15;

function extractVideoId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function VideosPage() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchVideos = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE,
    });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (category) params.set('category', category);
    fetch(`${API}/website/videos?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setVideos(d.rows || []);
        setTotal(d.total ?? 0);
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, category]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const featured = videos.filter((v) => v.is_featured);

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        padding: '3rem 1rem 2.5rem',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '2rem' }}>▶</span>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', fontWeight: 800 }}>{t('videos_page.title')}</h1>
          </div>
          <p style={{ margin: 0, fontSize: '1rem', opacity: 0.8, maxWidth: '600px', marginInline: 'auto' }}>
            {t('videos_page.subtitle')}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c4a35a' }}>{total}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('videos_page.videos')}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c4a35a' }}>{categories.length}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{t('videos_page.categories')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('videos_page.search_placeholder')}
            style={{
              flex: '1 1 200px', padding: '0.55rem 0.75rem',
              border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem',
            }}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            style={{ padding: '0.55rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem', minWidth: '160px' }}
          >
            <option value="">{t('videos_page.all_categories')}</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Videos grid */}
      <section className="container" style={{ padding: '2rem 1rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>{t('videos_page.loading')}</div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--color-text-muted)' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>{t('videos_page.no_videos_title')}</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {debouncedSearch || category ? t('videos_page.no_videos_search') : t('videos_page.no_videos_empty')}
            </p>
          </div>
        ) : (
          <>
            {/* Featured video (if any and on page 1) */}
            {page === 1 && featured.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>{t('videos_page.featured_video')}</h2>
                {(() => {
                  const v = featured[0];
                  const vid = extractVideoId(v.youtube_url);
                  return (
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
                      gap: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow)', overflow: 'hidden', border: '2px solid #c4a35a',
                    }}>
                      <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
                        {playing === v.id && vid ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
                            title={v.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                          />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} onClick={() => setPlaying(v.id)}>
                            {vid && <img src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', paddingLeft: '4px' }}>▶</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ padding: '0.15rem 0.5rem', background: '#c4a35a', color: '#fff', fontSize: '0.7rem', fontWeight: 700, borderRadius: '999px', alignSelf: 'flex-start', marginBottom: '0.5rem' }}>{t('videos_page.featured_badge')}</span>
                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>{v.title}</h3>
                        {v.description && <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{v.description}</p>}
                        <span style={{ fontSize: '0.78rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'var(--color-bg)', color: 'var(--color-text-muted)', alignSelf: 'flex-start' }}>{v.category}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {videos.filter((v) => !(page === 1 && featured.length > 0 && v.id === featured[0]?.id)).map((v) => {
                const vid = extractVideoId(v.youtube_url);
                return (
                  <div key={v.id} style={{
                    background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
                    overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s',
                    border: '1px solid var(--color-border)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                  >
                    {/* Thumbnail / Player */}
                    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#111' }}>
                      {playing === v.id && vid ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
                          title={v.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, cursor: 'pointer' }} onClick={() => setPlaying(v.id)}>
                          {vid && <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.25)', transition: 'background 0.2s' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.2rem', paddingLeft: '3px' }}>▶</div>
                          </div>
                        </div>
                      )}
                      {v.is_featured && (
                        <span style={{ position: 'absolute', top: '0.4rem', left: '0.4rem', padding: '0.1rem 0.4rem', background: '#c4a35a', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: '999px' }}>{t('videos_page.featured_badge')}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ padding: '0.75rem 1rem' }}>
                      <h3 style={{ margin: '0 0 0.3rem', fontSize: '0.95rem', fontWeight: 700, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{v.title}</h3>
                      {v.description && (
                        <p style={{ margin: '0 0 0.4rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 }}>{v.description}</p>
                      )}
                      <span style={{ fontSize: '0.72rem', padding: '0.1rem 0.4rem', borderRadius: '999px', background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>{v.category}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ marginTop: '2rem' }}>
                <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="video" />
              </div>
            )}
          </>
        )}
      </section>

      {/* Responsive featured grid */}
      <style>{`
        @media (max-width: 640px) {
          [style*="gridTemplateColumns: minmax(0, 2fr)"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
