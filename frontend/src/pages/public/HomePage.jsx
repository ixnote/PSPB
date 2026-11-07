import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { imageUrl } from '../../lib/imageUrl';

const API = '/api';

const FALLBACK_GRADIENTS = [
  'linear-gradient(135deg, #2d5a3d 0%, #1e3d29 100%)',
  'linear-gradient(135deg, #3d6b4f 0%, #2d5a3d 100%)',
  'linear-gradient(135deg, #4a7c5f 0%, #2d5a3d 100%)',
  'linear-gradient(135deg, #c4a35a 0%, #8b7340 100%)',
  'linear-gradient(135deg, #1a3d28 0%, #0d1f14 100%)',
];

const HOMEPAGE_PARTNERS_LIMIT = 12;

export function HomePage() {
  const { t } = useTranslation();
  const [carouselItems, setCarouselItems] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [liveStats, setLiveStats] = useState(null);

  const FOCUS_AREAS = [
    { title: t('home.community_dialogue'), desc: t('home.community_dialogue_desc'), img: 'focus-dialogue.jpg', link: '/our-work' },
    { title: t('home.conflict_prevention'), desc: t('home.conflict_prevention_desc'), img: 'focus-prevention.jpg', link: '/conflict-data' },
    { title: t('home.youth_women'), desc: t('home.youth_women_desc'), img: 'focus-youth.jpg', link: '/page/unit-gender-youth' },
    { title: t('home.research_learning'), desc: t('home.research_learning_desc'), img: 'focus-research.jpg', link: '/page/unit-research' },
  ];

  const IMPACT_STATS = [
    { value: liveStats ? liveStats.lgasCovered : '–', label: t('home.lgas_covered') },
    { value: '100+', label: t('home.dialogues_held') },
    { value: liveStats ? liveStats.peaceActors : '–', label: t('home.peace_actors') },
    { value: '1000+', label: t('home.lives_impacted') },
  ];

  const fallbackSlides = [
    { id: 'f1', title: t('home.fallback_title_1'), excerpt: t('home.fallback_excerpt_1'), link: '/about', imagePath: 'hero-homepage-1.jpg' },
    { id: 'f2', title: t('home.fallback_title_2'), excerpt: t('home.fallback_excerpt_2'), link: '/our-work', imagePath: 'hero-homepage-2.jpg' },
    { id: 'f3', title: t('home.fallback_title_3'), excerpt: t('home.fallback_excerpt_3'), link: '/conflict-data', imagePath: 'hero-homepage-3.jpg' },
  ];

  useEffect(() => {
    fetch(`${API}/website/homepage-carousel`).then((r) => (r.ok ? r.json() : [])).then(setCarouselItems);
    fetch(`${API}/website/news?limit=3`).then((r) => (r.ok ? r.json() : { rows: [] })).then((d) => setNews(d.rows || d));
    fetch(`${API}/website/events?limit=5`).then((r) => (r.ok ? r.json() : { rows: [] })).then((d) => setEvents(d.rows || d));
    fetch(`${API}/website/partners?limit=${HOMEPAGE_PARTNERS_LIMIT}`).then((r) => (r.ok ? r.json() : { rows: [] })).then((d) => setPartners(d.rows || d));
    fetch(`${API}/website/galleries?limit=6`).then((r) => (r.ok ? r.json() : { rows: [] })).then((d) => setGalleries(d.rows || d));
    fetch(`${API}/website/homepage-stats`).then((r) => (r.ok ? r.json() : null)).then(setLiveStats);
  }, []);

  const slides = carouselItems.length > 0 ? carouselItems : fallbackSlides;

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const intervalId = setInterval(() => setActiveIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(intervalId);
  }, [slides.length]);

  const upcomingEvents = events.filter((e) => new Date(e.start_at) >= new Date()).slice(0, 3);

  return (
    <>
      <style>{`
        .home-hero { position: relative; height: 70vh; min-height: 360px; max-height: 540px; overflow: hidden; background: #1a3d28; }
        .home-hero-slide { position: absolute; inset: 0; display: flex; align-items: flex-end; background-size: cover; background-position: center; opacity: 0; transition: opacity 0.8s ease-in-out; }
        .home-hero-slide.active { opacity: 1; z-index: 1; }
        .home-hero-slide::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%); pointer-events: none; }
        .home-hero-content { position: relative; z-index: 1; padding: 2.5rem 1.5rem; max-width: var(--max-width); margin: 0 auto; width: 100%; }
        .home-hero-content h2 { color: white; font-size: clamp(1.6rem, 4.5vw, 2.5rem); margin: 0 0 0.5rem; font-weight: 700; text-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .home-hero-content p { color: rgba(255,255,255,0.95); margin: 0; font-size: clamp(1rem, 2vw, 1.15rem); max-width: 38rem; text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
        .home-hero-content .hero-btn { display: inline-block; margin-top: 1rem; padding: 0.65rem 1.5rem; background: var(--color-primary); color: white; border-radius: var(--radius); font-weight: 600; text-decoration: none; transition: background 0.2s; }
        .home-hero-content .hero-btn:hover { background: var(--color-primary-hover); text-decoration: none; }
        .hero-dots { position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; gap: 0.5rem; }
        .hero-dots span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: background 0.3s; }
        .hero-dots span.active { background: white; }
        @media (min-width: 768px) { .home-hero { min-height: 420px; max-height: 560px; } }
        @media (max-width: 640px) { .home-hero-content h2 { font-size: 1.3rem; } .home-two-col { grid-template-columns: 1fr !important; } .focus-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ═══ HERO CAROUSEL ═══ */}
      <section className="home-hero">
        {slides.map((item, i) => (
          <div
            key={item.id}
            className={`home-hero-slide ${i === activeIndex ? 'active' : ''}`}
            style={{ backgroundImage: item.imagePath ? `url(${imageUrl(item.imagePath)})` : FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length] }}
          >
            <div className="home-hero-content">
              <h2>{item.title}</h2>
              {item.excerpt && <p>{item.excerpt}</p>}
              {item.link && <Link to={item.link} className="hero-btn">{t('home.learn_more')}</Link>}
            </div>
          </div>
        ))}
        <div className="hero-dots">
          {slides.map((_, i) => (
            <span key={i} className={i === activeIndex ? 'active' : ''} onClick={() => setActiveIndex(i)} />
          ))}
        </div>
      </section>

      {/* ═══ IMPACT STATS BANNER ═══ */}
      <section style={{
        background: 'var(--color-primary)',
        color: 'white',
        padding: '1.25rem 1rem',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem 2rem',
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
        }}>
          {IMPACT_STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center', minWidth: '100px' }}>
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 800, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>

        {/* ═══ INTRO ═══ */}
        <section style={{ textAlign: 'center', maxWidth: '44rem', margin: '0 auto 3rem' }}>
          <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.75rem)', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
            {t('home.building_lasting_peace')}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            {t('home.intro_text')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <Link to="/about" style={{ padding: '0.6rem 1.25rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('home.about_pspba')}</Link>
            <Link to="/conflict-data" style={{ padding: '0.6rem 1.25rem', border: '2px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('home.conflict_database')}</Link>
            <Link to="/apply" style={{ padding: '0.6rem 1.25rem', border: '2px solid var(--color-accent)', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('home.get_involved')}</Link>
          </div>
        </section>

        {/* ═══ FOCUS AREAS — Image Cards ═══ */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>{t('home.what_we_do')}</h2>
          <div className="focus-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {FOCUS_AREAS.map((area) => (
              <Link
                key={area.title}
                to={area.link}
                style={{
                  display: 'block',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'var(--color-surface)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img src={imageUrl(area.img)} alt={area.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
                    onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; }}
                  />
                </div>
                <div style={{ padding: '1rem 1.15rem' }}>
                  <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', color: 'var(--color-primary)' }}>{area.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.45 }}>{area.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ FEATURED GALLERY STRIP ═══ */}
        {galleries.length > 0 && (
          <section style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <h2 style={{ fontSize: '1.3rem', margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>{t('home.from_the_field')}</h2>
              <Link to="/galleries" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('home.all_galleries')}</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {galleries.slice(0, 4).map((g) => (
                <Link
                  key={g.id}
                  to={`/galleries/${g.slug}`}
                  style={{
                    display: 'block',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '4/3',
                    background: 'var(--color-bg)',
                    textDecoration: 'none',
                  }}
                >
                  {g.cover_image_path ? (
                    <img src={imageUrl(g.cover_image_path)} alt={g.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  )}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    padding: '2rem 0.75rem 0.6rem',
                    color: 'white', fontSize: '0.85rem', fontWeight: 600,
                  }}>
                    {g.title}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══ QUICK ACCESS — image-backed cards ═══ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { to: '/repository', title: t('home.documents_reports'), desc: t('home.documents_reports_desc'), img: 'card-education.jpg' },
            { to: '/events', title: t('home.events_calendar'), desc: t('home.events_calendar_desc'), img: 'card-relief.jpg' },
            { to: '/map', title: t('home.conflict_map_title'), desc: t('home.conflict_map_desc'), img: 'card-art.jpg' },
          ].map((card) => (
            <Link
              key={card.to}
              to={card.to}
              style={{
                position: 'relative',
                display: 'block',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                minHeight: '160px',
                textDecoration: 'none',
                color: 'white',
              }}
            >
              <img src={imageUrl(card.img)} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'relative',
                height: '100%',
                minHeight: '160px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.25))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '1.25rem',
              }}>
                <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.1rem', fontWeight: 700 }}>{card.title}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>{card.desc}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* ═══ PARTNERS ═══ */}
        <section style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0, paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>{t('home.our_partners')}</h2>
            <Link to="/partners" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('home.view_all')}</Link>
          </div>
          {partners.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>{t('home.no_partners')}</p>
          ) : (
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
              gap: '1.5rem 2rem', padding: '1.5rem 1rem',
              background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
            }}>
              {partners.map((p) => {
                const logoSrc = p.logo_path
                  ? (p.logo_path.startsWith('http') ? p.logo_path : `/api/website/files/${p.logo_path}`)
                  : p.url ? `https://logo.clearbit.com/${new URL(p.url).hostname}` : null;
                return (
                  <a key={p.id} href={p.url || '/partners'} target={p.url ? '_blank' : '_self'} rel="noopener noreferrer" title={p.name}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100px', height: '60px', opacity: 0.75, transition: 'opacity 0.2s, transform 0.2s', textDecoration: 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {logoSrc ? (
                      <img src={logoSrc} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'grayscale(40%)' }}
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <span style={{
                      display: logoSrc ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '100%', background: 'var(--color-bg)', borderRadius: 'var(--radius)',
                      fontWeight: 700, fontSize: '0.7rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.2, padding: '0.25rem',
                    }}>{p.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ NEWS + EVENTS (two-column) ═══ */}
        <section className="home-two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '3rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>{t('home.latest_news')}</h2>
            {news.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>{t('home.no_news')}</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {news.map((p) => (
                  <li key={p.id} style={{ marginBottom: '1.15rem', paddingBottom: '1.15rem', borderBottom: '1px solid var(--color-border)' }}>
                    <Link to={`/news/${p.slug}`} style={{ fontWeight: 600, fontSize: '1.05rem' }}>{p.title}</Link>
                    {p.excerpt && <p style={{ margin: '0.3rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.45 }}>{p.excerpt}</p>}
                    {p.published_at && <time style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(p.published_at).toLocaleDateString()}</time>}
                  </li>
                ))}
              </ul>
            )}
            <Link to="/news" style={{ display: 'inline-block', marginTop: '0.25rem', fontWeight: 600 }}>{t('home.all_news')}</Link>
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>{t('home.upcoming_events')}</h2>
            {upcomingEvents.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)' }}>{t('home.no_upcoming_events')} <Link to="/events">{t('home.view_past_events')}</Link>.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {upcomingEvents.map((e) => (
                  <li key={e.id} style={{ marginBottom: '0.85rem', padding: '0.85rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--color-primary)' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{e.title}</strong>
                    <div style={{ marginTop: '0.3rem' }}>
                      <time style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>{new Date(e.start_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</time>
                      {e.location && <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>&middot; {e.location}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/events" style={{ display: 'inline-block', marginTop: '0.25rem', fontWeight: 600 }}>{t('home.all_events')}</Link>
          </div>
        </section>

        {/* ═══ CTA — full-width image background ═══ */}
        <section style={{
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          minHeight: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img src={imageUrl('cta-background.jpg')} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{
            position: 'relative',
            textAlign: 'center',
            color: 'white',
            padding: '2.5rem 1.5rem',
            background: 'rgba(45, 90, 61, 0.85)',
            width: '100%',
          }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700 }}>{t('home.be_part_solution')}</h2>
            <p style={{ margin: '0 0 1.25rem', opacity: 0.95, fontSize: '1rem', maxWidth: '32rem', marginLeft: 'auto', marginRight: 'auto' }}>
              {t('home.cta_text')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
              <Link to="/apply" style={{ display: 'inline-block', padding: '0.65rem 1.5rem', background: 'white', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('home.apply_now')}</Link>
              <Link to="/contact" style={{ display: 'inline-block', padding: '0.65rem 1.5rem', border: '2px solid white', color: 'white', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('home.contact_us')}</Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
