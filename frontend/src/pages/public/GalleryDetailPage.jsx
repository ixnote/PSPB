import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';

const API = '/api';

export function GalleryDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/website/galleries/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Not found');
        return r.json();
      })
      .then(setGallery)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const items = gallery?.items || [];

  const openLightbox = useCallback((idx) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(-1), []);
  const prev = useCallback(() => setLightboxIndex((i) => (i > 0 ? i - 1 : items.length - 1)), [items.length]);
  const next = useCallback(() => setLightboxIndex((i) => (i < items.length - 1 ? i + 1 : 0)), [items.length]);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIndex < 0) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [lightboxIndex, closeLightbox, prev, next]);

  // Lock body scroll when lightbox open
  useEffect(() => {
    if (lightboxIndex >= 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lightboxIndex]);

  if (loading) return <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('gallery_detail.loading')}</div>;

  if (error || !gallery) {
    return (
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1rem' }} />
        <h2 style={{ margin: '0 0 0.5rem', color: 'var(--color-text)' }}>{t('gallery_detail.not_found')}</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('gallery_detail.not_found_text')}</p>
        <Link to="/galleries" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>{t('gallery_detail.back_to_galleries')}</Link>
      </div>
    );
  }

  const coverImg = gallery.cover_image_path ? imageUrl(gallery.cover_image_path) : null;

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Cover Image Hero */}
      {coverImg ? (
        <div style={{ width: '100%', height: 'min(40vh, 360px)', minHeight: 200, overflow: 'hidden', position: 'relative', background: '#1a3d28' }}>
          <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 0.25rem', color: 'white', fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', fontWeight: 700, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              {gallery.title}
            </h1>
            {gallery.description && (
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '1rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
                {gallery.description}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', height: 100, background: 'linear-gradient(135deg, #2d5a3d, #1a3d28)' }} />
      )}

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* Breadcrumb + title (if no cover) */}
        <nav style={{ marginTop: coverImg ? '1.5rem' : '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link to="/galleries" style={{ color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', fontSize: '0.9rem' }}>
            {t('gallery_detail.back_to_galleries')}
          </Link>
          {items.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {items.length} {items.length === 1 ? t('gallery_detail.photo') : t('gallery_detail.photos')}
            </span>
          )}
        </nav>

        {!coverImg && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ margin: '0 0 0.35rem', fontSize: 'clamp(1.3rem, 3vw, 1.8rem)', color: 'var(--color-text)' }}>{gallery.title}</h1>
            {gallery.description && <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1rem' }}>{gallery.description}</p>}
          </div>
        )}

        {/* Photo Grid */}
        {items.length === 0 ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px dashed var(--color-border)' }}>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '1rem' }}>{t('gallery_detail.no_images')}</p>
          </div>
        ) : (
          <div className="photo-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {items.map((item, idx) => (
              <figure
                key={item.id}
                style={{
                  margin: 0,
                  position: 'relative',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: 'var(--color-bg)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onClick={() => openLightbox(idx)}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <img
                  src={imageUrl(item.file_path)}
                  alt={item.caption || ''}
                  loading="lazy"
                  style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
                />
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0)',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; }}
                >
                  <span style={{ color: 'white', fontSize: '1.5rem', opacity: 0, transition: 'opacity 0.2s' }}
                    ref={(el) => {
                      if (el) {
                        el.parentElement.onmouseenter = () => { el.style.opacity = '1'; el.parentElement.style.background = 'rgba(0,0,0,0.3)'; };
                        el.parentElement.onmouseleave = () => { el.style.opacity = '0'; el.parentElement.style.background = 'rgba(0,0,0,0)'; };
                      }
                    }}
                  >
                    +
                  </span>
                </div>
                {item.caption && (
                  <figcaption style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2rem 0.75rem 0.65rem',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                    color: 'white',
                    fontSize: '0.8rem',
                    lineHeight: 1.3,
                  }}>
                    {item.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxIndex >= 0 && items[lightboxIndex] && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '2rem',
              cursor: 'pointer',
              zIndex: 10,
              padding: '0.25rem',
              lineHeight: 1,
            }}
            aria-label={t('gallery_detail.close')}
          >
            ✕
          </button>

          {/* Prev */}
          {items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backdropFilter: 'blur(4px)',
              }}
              aria-label={t('gallery_detail.previous')}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <img
              src={imageUrl(items[lightboxIndex].file_path)}
              alt={items[lightboxIndex].caption || ''}
              style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 'var(--radius)' }}
            />
            {items[lightboxIndex].caption && (
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', marginTop: '0.75rem', textAlign: 'center', maxWidth: 600 }}>
                {items[lightboxIndex].caption}
              </p>
            )}
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '0.35rem 0 0' }}>
              {lightboxIndex + 1} / {items.length}
            </p>
          </div>

          {/* Next */}
          {items.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              style={{
                position: 'absolute',
                right: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: 'white',
                fontSize: '1.5rem',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backdropFilter: 'blur(4px)',
              }}
              aria-label={t('gallery_detail.next')}
            >
              ›
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) { .photo-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .photo-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
