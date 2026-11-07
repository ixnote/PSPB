import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const PAGE_SIZE = 15;

export function PartnersPage() {
  const { t } = useTranslation();
  const [partners, setPartners] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);

  const fetchPartners = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (filter !== 'all') params.set('category', filter);
    fetch(`${API}/website/partners?${params}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => { setPartners(d.rows || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  const handleFilter = (f) => { setFilter(f); setPage(0); };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const international = partners.filter((p) => p.category === 'international');
  const local = partners.filter((p) => p.category === 'local');

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h1>{t('partners_page.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', maxWidth: '40rem' }}>
        {t('partners_page.description')}
        {total > 0 && <span style={{ fontWeight: 600 }}> ({total} {total !== 1 ? t('partners_page.partners_plural') : t('partners_page.partner')})</span>}
      </p>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['all', 'international', 'local'].map((f) => (
          <button key={f} type="button" onClick={() => handleFilter(f)} style={{
            padding: '0.5rem 1rem',
            border: `2px solid ${filter === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: filter === f ? 'var(--color-primary)' : 'transparent',
            color: filter === f ? 'white' : 'var(--color-text)',
            borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
          }}>{f === 'all' ? t('partners_page.all') : f === 'international' ? t('partners_page.international') : t('partners_page.local')}</button>
        ))}
      </div>

      {loading ? (
        <p>{t('partners_page.loading')}</p>
      ) : partners.length === 0 ? (
        <p>{t('partners_page.no_partners')}</p>
      ) : (
        <>
          {international.length > 0 && (
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('partners_page.international_partners')}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {international.map((p) => (
                  <a key={p.id} href={p.url || '#'} target={p.url ? '_blank' : undefined} rel={p.url ? 'noopener noreferrer' : undefined} style={{
                    display: 'inline-block', padding: '0.75rem 1.25rem',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                    color: p.url ? 'var(--color-primary)' : 'var(--color-text)', textDecoration: 'none', fontWeight: 500, boxShadow: 'var(--shadow)',
                  }}>{p.name}</a>
                ))}
              </div>
            </section>
          )}
          {local.length > 0 && (
            <section>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('partners_page.local_partners')}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {local.map((p) => (
                  <span key={p.id} style={{
                    display: 'inline-block', padding: '0.75rem 1.25rem',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
                    color: 'var(--color-text)', fontWeight: 500, boxShadow: 'var(--shadow)',
                  }}>{p.name}</span>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="partner" />
    </div>
  );
}
