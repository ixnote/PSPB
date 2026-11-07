import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';

const API = '/api';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function NewsPostPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API}/website/news/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data) => {
        setPost(data);
        // Fetch related posts
        fetch(`${API}/website/news?limit=4`)
          .then((r) => (r.ok ? r.json() : { rows: [] }))
          .then((d) => { const all = d.rows || d; setRelated(all.filter((p) => p.slug !== slug).slice(0, 3)); });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('news_post.loading')}</div>;

  if (error || !post) {
    return (
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', color: 'var(--color-text)' }}>{t('news_post.not_found')}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('news_post.not_found_text')}</p>
        <Link to="/news" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>{t('news_post.back_to_news')}</Link>
      </div>
    );
  }

  const heroImg = post.featured_image_path ? imageUrl(post.featured_image_path) : null;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Hero / Featured Image */}
      {heroImg ? (
        <div style={{ width: '100%', height: 'min(45vh, 400px)', minHeight: 240, overflow: 'hidden', position: 'relative', background: '#1a3d28' }}>
          <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
        </div>
      ) : (
        <div style={{ width: '100%', height: 120, background: 'linear-gradient(135deg, #2d5a3d, #1a3d28)' }} />
      )}

      <article style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 1rem' }}>
        {/* Breadcrumb */}
        <nav style={{ marginTop: heroImg ? '-2rem' : '1.5rem', position: 'relative', zIndex: 1, marginBottom: '1.5rem' }}>
          <Link to="/news" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: heroImg ? 'white' : 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.9rem', textShadow: heroImg ? '0 1px 3px rgba(0,0,0,0.4)' : 'none' }}>
            {t('news_post.back_to_news')}
          </Link>
        </nav>

        {/* Title & Meta */}
        <header style={{ marginBottom: '2rem' }}>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, lineHeight: 1.25, color: 'var(--color-text)' }}>
            {post.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {post.published_at && (
              <time style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                {formatDate(post.published_at)}
              </time>
            )}
          </div>
          <div style={{ width: '3rem', height: '3px', background: 'var(--color-primary)', borderRadius: '2px', marginTop: '1rem' }} />
        </header>

        {/* Body */}
        {post.body ? (
          <div
            className="content-body"
            style={{
              fontSize: '1.05rem',
              lineHeight: 1.8,
              color: 'var(--color-text)',
            }}
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        ) : post.excerpt ? (
          <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--color-text)' }}>{post.excerpt}</p>
        ) : null}

        {/* Share / Actions */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <Link to="/news" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            {t('news_post.more_news')}
          </Link>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t('news_post.share')}</span>
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '1.15rem' }} title={t('news_post.share_x')}>𝕏</a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '1.1rem' }} title={t('news_post.share_facebook')}>f</a>
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.25rem', color: 'var(--color-text)', borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem' }}>
              {t('news_post.related_stories')}
            </h2>
            <div className="related-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
              {related.map((r, idx) => (
                <Link
                  key={r.id}
                  to={`/news/${r.slug}`}
                  style={{
                    display: 'block',
                    background: 'var(--color-surface)',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow)',
                    textDecoration: 'none',
                    color: 'inherit',
                    border: '1px solid var(--color-border)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                >
                  <div style={{ height: 120, overflow: 'hidden', background: 'linear-gradient(135deg, #2d5a3d, #3d7a5d)' }}>
                    {r.featured_image_path ? (
                      <img src={imageUrl(r.featured_image_path)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%' }} />
                    )}
                  </div>
                  <div style={{ padding: '0.75rem 1rem' }}>
                    <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.title}
                    </h4>
                    {r.published_at && (
                      <time style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {new Date(r.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </time>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>

      <style>{`
        .content-body img { max-width: 100%; height: auto; border-radius: var(--radius); margin: 1rem 0; }
        .content-body a { color: var(--color-primary); }
        .content-body blockquote { border-left: 3px solid var(--color-primary); margin: 1.5rem 0; padding: 0.75rem 1.25rem; background: rgba(45,90,61,0.05); border-radius: 0 var(--radius) var(--radius) 0; font-style: italic; }
        .content-body h2, .content-body h3 { margin-top: 2rem; color: var(--color-text); }
        @media (max-width: 768px) { .related-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
