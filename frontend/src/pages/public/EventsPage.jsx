import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { imageUrl } from '../../lib/imageUrl';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const HERO_IMG = 'hero-events.jpg';
const PAGE_SIZE = 15;

function formatDate(dateStr) {
  if (!dateStr) return { day: '', month: '', full: '' };
  const d = new Date(dateStr);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    year: d.getFullYear(),
    full: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function EventsPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (query.trim()) params.set('search', query.trim());
    fetch(`${API}/website/events?${params}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => { setEvents(d.rows || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSearch = (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => { setQuery(val); setPage(0); }, 350);
    setSearchTimeout(t);
  };

  const now = new Date();
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
          <h1 style={{ color: 'white', fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 700, margin: '0 0 0.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{t('events.title')}</h1>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {t('events.subtitle')}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* Search */}
        <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem', fontWeight: 500 }}>
            {total > 0 ? `${total} ${total !== 1 ? t('events.events_plural') : t('events.event')}` : ''}
          </p>
          <div style={{ position: 'relative', minWidth: 220, flex: '0 1 360px' }}>
            <svg style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="search"
              placeholder={t('events.search_placeholder')}
              defaultValue={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                fontSize: '0.9rem', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Events List */}
        <section style={{ marginTop: '2rem' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('events.loading')}</div>
          ) : events.length === 0 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', border: '1px dashed var(--color-border)' }}>
              <p style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: 'var(--color-text)' }}>
                {query ? t('events.no_match') : t('events.no_events')}
              </p>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{t('events.check_back')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {events.map((ev, idx) => {
                const d = formatDate(ev.start_at);
                const isPast = new Date(ev.start_at) < now;
                return (
                  <article key={ev.id} style={{
                    display: 'flex', gap: '1.25rem', background: 'var(--color-surface)',
                    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden',
                    border: '1px solid var(--color-border)', opacity: isPast ? 0.75 : 1,
                    transition: 'box-shadow 0.2s, transform 0.2s',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {/* Date badge */}
                    <div style={{
                      minWidth: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      background: isPast ? 'var(--color-bg)' : 'var(--color-primary)',
                      color: isPast ? 'var(--color-text-muted)' : 'white', padding: '1rem 0.5rem', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>{d.month}</span>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, lineHeight: 1.1 }}>{d.day}</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>{d.year}</span>
                    </div>
                    {/* Content */}
                    <div style={{ padding: '1rem 1.25rem 1rem 0', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>{ev.title}</h3>
                        {isPast && (
                          <span style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, background: 'var(--color-bg)', color: 'var(--color-text-muted)', borderRadius: 'var(--radius)', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('events.past')}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {d.time}
                          {ev.end_at && ` – ${new Date(ev.end_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                        {ev.location && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>{ev.location}</span>
                        )}
                      </div>
                      {ev.description && (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="event" />

        {/* CTA */}
        <section style={{ marginTop: '2rem', padding: '2rem 1.5rem', background: 'var(--color-primary)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: 'white', fontSize: '1.3rem', fontWeight: 700 }}>{t('events.stay_updated')}</h2>
          <p style={{ margin: '0 0 1.25rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            {t('events.stay_updated_text')}
          </p>
          <Link to="/contact" style={{ display: 'inline-block', padding: '0.6rem 1.5rem', background: 'white', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none' }}>{t('events.contact_us')}</Link>
        </section>
      </div>
    </div>
  );
}
