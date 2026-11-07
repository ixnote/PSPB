import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { imageUrl } from '../../lib/imageUrl';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const PAGE_SIZE = 15;

const PLATEAU_LGAS = [
  'Barkin Ladi','Bassa','Bokkos','Jos East','Jos North','Jos South','Kanam','Kanke',
  'Langtang North','Langtang South','Mangu','Mikang','Pankshin',"Qua'an Pan",'Riyom','Shendam','Wase',
];

const HERO_IMG = 'hero-about.jpg';

const inputStyle = {
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  fontSize: '0.9rem',
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
};

const btnStyle = {
  padding: '0.5rem 1.2rem',
  borderRadius: 'var(--radius)',
  border: 'none',
  background: 'var(--color-primary)',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.9rem',
};

const cardStyle = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};

export function PeacebuildingActorsPublicPage() {
  const { t } = useTranslation();
  const [data, setData] = useState({ rows: [], total: 0, actorTypes: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ search: '', lga: '', type: '' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.lga) params.set('lga', filters.lga);
      if (filters.type) params.set('type', filters.type);
      params.set('limit', PAGE_SIZE);
      params.set('offset', page * PAGE_SIZE);
      const res = await fetch(`${API}/conflict/public-actors?${params}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalPages = Math.ceil(data.total / PAGE_SIZE);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
    setExpandedRow(null);
  };

  const clearFilters = () => {
    setFilters({ search: '', lga: '', type: '' });
    setPage(0);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '320px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a365d 0%, #2d6a4f 100%)',
      }}>
        <img
          src={imageUrl(HERO_IMG)}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
        />
        <div style={{ position: 'relative', textAlign: 'center', color: '#fff', padding: '3rem 1rem', maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: '0.75rem', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
            {t('actors.title')}
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.92, lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            {t('actors.subtitle')}
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', padding: '1rem 0' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'center', alignItems: 'center' }}>
          <StatBadge label={t('actors.total_organizations')} value={data.total} color="#2563eb" />
          <StatBadge label={t('actors.lgas_covered')} value={PLATEAU_LGAS.length} color="#059669" />
          <StatBadge label={t('actors.intervention_types')} value={data.actorTypes?.length || 0} color="#7c3aed" />
        </div>
      </section>

      {/* Filters */}
      <section className="container" style={{ padding: '1.5rem 1rem' }}>
        <div style={{
          ...cardStyle,
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'flex-end',
        }}>
          <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('actors.search')}
            </label>
            <input
              type="text"
              placeholder={t('actors.search_placeholder')}
              value={filters.search}
              onChange={(e) => handleFilter('search', e.target.value)}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
          <div style={{ flex: '0 1 180px', minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('actors.lga')}
            </label>
            <select value={filters.lga} onChange={(e) => handleFilter('lga', e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">{t('actors.all_lgas')}</option>
              {PLATEAU_LGAS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div style={{ flex: '0 1 180px', minWidth: '160px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('actors.actor_type')}
            </label>
            <select value={filters.type} onChange={(e) => handleFilter('type', e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="">{t('actors.all_types')}</option>
              {(data.actorTypes || []).map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={clearFilters} style={{ ...btnStyle, background: 'var(--color-text-muted)' }}>
              {t('actors.clear')}
            </button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                ...btnStyle,
                background: viewMode === 'table' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                padding: '0.4rem 0.7rem',
              }}
              title={t('actors.table_view')}
            >
              ☰
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                ...btnStyle,
                background: viewMode === 'cards' ? 'var(--color-primary)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
                padding: '0.4rem 0.7rem',
              }}
              title={t('actors.card_view')}
            >
              ▦
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container" style={{ padding: '0 1rem 2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            {t('actors.loading')}
          </div>
        ) : data.rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>{t('actors.no_results')}</p>
            <button onClick={clearFilters} style={{ ...btnStyle, marginTop: '1rem' }}>{t('actors.clear_filters')}</button>
          </div>
        ) : viewMode === 'table' ? (
          <TableView rows={data.rows || []} expandedRow={expandedRow} setExpandedRow={setExpandedRow} t={t} />
        ) : (
          <CardsView rows={data.rows || []} t={t} />
        )}
      </section>

      {/* Pagination */}
      <section className="container" style={{ padding: '0 1rem 2rem' }}>
        <Pagination page={page} totalPages={totalPages} total={data.total} onPageChange={setPage} noun="organization" />
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2d6a4f 100%)',
        color: '#fff',
        padding: '3rem 1rem',
        textAlign: 'center',
      }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {t('actors.register_title')}
          </h2>
          <p style={{ opacity: 0.9, lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {t('actors.register_text')}
          </p>
          <a href="/contact" style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#fff',
            color: '#1a365d',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '1rem',
          }}>
            {t('actors.register_button')}
          </a>
        </div>
      </section>

      <style>{`
        .actors-table { width: 100%; border-collapse: collapse; }
        .actors-table th, .actors-table td { padding: 0.65rem 0.75rem; text-align: left; border-bottom: 1px solid var(--color-border); font-size: 0.88rem; }
        .actors-table th { background: var(--color-bg); font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-size: 0.75rem; position: sticky; top: 0; z-index: 1; }
        .actors-table tr:hover td { background: rgba(37,99,235,0.04); }
        .actors-table tr.expanded td { background: rgba(37,99,235,0.06); border-bottom: none; }
        .actors-table .expand-btn { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0.2rem 0.4rem; color: var(--color-primary); }
        .actor-details { background: rgba(37,99,235,0.03); border-bottom: 1px solid var(--color-border); }
        .actor-details td { padding: 1rem 0.75rem; }
        .detail-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
        .detail-item { font-size: 0.85rem; }
        .detail-item .label { font-weight: 600; color: var(--color-text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem; }
        .detail-item .value { color: var(--color-text); line-height: 1.5; }
        .actor-card { background: var(--color-surface); border-radius: var(--radius); box-shadow: 0 1px 4px rgba(0,0,0,0.08); padding: 1.25rem; transition: box-shadow 0.2s, transform 0.2s; }
        .actor-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.12); transform: translateY(-2px); }
        .actor-card-header { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.75rem; }
        .actor-card-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
        .actor-card-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border); }
        .actor-card-meta .meta-item { font-size: 0.8rem; }
        .actor-card-meta .meta-item .label { color: var(--color-text-muted); font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; }
        @media (max-width: 768px) {
          .actors-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .actors-table th:nth-child(n+5), .actors-table td:nth-child(n+5) { display: none; }
          .detail-grid { grid-template-columns: 1fr; }
          .actor-card-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* Stat Badge */
function StatBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div>
        <div style={{ fontSize: '1.3rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      </div>
    </div>
  );
}

/* Table View */
function TableView({ rows, expandedRow, setExpandedRow, t }) {
  return (
    <div className="actors-table-wrap" style={{ ...cardStyle, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table className="actors-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th>{t('actors.organization')}</th>
              <th>{t('actors.year')}</th>
              <th>{t('actors.type')}</th>
              <th>{t('actors.expertise')}</th>
              <th>{t('actors.contact_col')}</th>
              <th>{t('actors.lga')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <>
                <tr key={row.id} className={expandedRow === row.id ? 'expanded' : ''} style={{ cursor: 'pointer' }} onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)}>
                  <td>
                    <button className="expand-btn" aria-label={t('actors.expand_details')}>
                      {expandedRow === row.id ? '▾' : '▸'}
                    </button>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.name}</td>
                  <td>{row.year_established || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: row.actor_type === 'State Actor' ? '#dbeafe' : '#dcfce7',
                      color: row.actor_type === 'State Actor' ? '#1d4ed8' : '#166534',
                    }}>
                      {row.actor_type || t('actors.na')}
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.expertise ?? '—'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {row.contact_name || '—'}
                  </td>
                  <td>{row.lga || '—'}</td>
                </tr>
                {expandedRow === row.id && (
                  <tr key={`${row.id}-detail`} className="actor-details">
                    <td colSpan={7}>
                      <ExpandedDetails row={row} t={t} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Expanded Detail Row */
function ExpandedDetails({ row, t }) {
  const fields = [
    { label: t('actors.org_name'), value: row.name },
    { label: t('actors.year_established'), value: row.year_established },
    { label: t('actors.actor_type'), value: row.actor_type },
    { label: t('actors.expertise_desc'), value: row.expertise },
    { label: t('actors.office_address'), value: row.office_address },
    { label: t('actors.contact_name'), value: row.contact_name },
    { label: t('actors.contact_position'), value: row.contact_position },
    { label: t('actors.email'), value: row.contact_email, isEmail: true },
    { label: t('actors.phone'), value: row.contact_phone },
    { label: t('actors.website'), value: row.website, isLink: true },
    { label: t('actors.focus_areas'), value: row.focus_areas?.join(', ') },
    { label: t('actors.type_of_intervention'), value: row.intervention_type },
    { label: t('actors.lga'), value: row.lga },
    { label: t('actors.lgas_of_intervention'), value: row.lgas_of_intervention?.join(', ') },
    { label: t('actors.community_of_intervention'), value: row.community_of_intervention },
    { label: t('actors.target_group'), value: row.target_group },
    { label: t('actors.donors'), value: row.donors },
    { label: t('actors.observation'), value: row.observation },
  ];

  return (
    <div className="detail-grid">
      {fields.filter((f) => f.value).map((f) => (
        <div key={f.label} className="detail-item">
          <div className="label">{f.label}</div>
          <div className="value">
            {f.isEmail ? <a href={`mailto:${f.value}`} style={{ color: 'var(--color-primary)' }}>{f.value}</a>
              : f.isLink ? <a href={f.value.startsWith('http') ? f.value : `https://${f.value}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{f.value}</a>
              : f.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Cards View */
function CardsView({ rows, t }) {
  const colors = ['#2563eb', '#059669', '#7c3aed', '#dc2626', '#ea580c', '#0891b2', '#4f46e5', '#0d9488'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
      {rows.map((row, idx) => {
        const color = colors[idx % colors.length];
        const initials = row.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
        return (
          <div key={row.id} className="actor-card">
            <div className="actor-card-header">
              <div className="actor-card-icon" style={{ background: `${color}15`, color }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.3, color: 'var(--color-text)' }}>{row.name}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: row.actor_type === 'State Actor' ? '#dbeafe' : '#dcfce7',
                    color: row.actor_type === 'State Actor' ? '#1d4ed8' : '#166534',
                  }}>
                    {row.actor_type || t('actors.unknown')}
                  </span>
                  {row.year_established && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('actors.est')} {row.year_established}</span>
                  )}
                </div>
              </div>
            </div>

            {row.expertise && (
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                margin: '0 0 0.5rem',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {row.expertise}
              </p>
            )}

            <div className="actor-card-meta">
              {row.contact_name && (
                <div className="meta-item">
                  <div className="label">{t('actors.contact_label')}</div>
                  <div>{row.contact_name}{row.contact_position ? ` — ${row.contact_position}` : ''}</div>
                </div>
              )}
              {row.lga && (
                <div className="meta-item">
                  <div className="label">{t('actors.lga')}</div>
                  <div>{row.lga}</div>
                </div>
              )}
              {row.contact_email && (
                <div className="meta-item">
                  <div className="label">{t('actors.email')}</div>
                  <div><a href={`mailto:${row.contact_email}`} style={{ color: 'var(--color-primary)', fontSize: '0.82rem' }}>{row.contact_email}</a></div>
                </div>
              )}
              {row.contact_phone && (
                <div className="meta-item">
                  <div className="label">{t('actors.phone')}</div>
                  <div style={{ fontSize: '0.82rem' }}>{row.contact_phone}</div>
                </div>
              )}
              {row.intervention_type && (
                <div className="meta-item">
                  <div className="label">{t('actors.intervention')}</div>
                  <div style={{ fontSize: '0.82rem' }}>{row.intervention_type}</div>
                </div>
              )}
              {row.office_address && (
                <div className="meta-item">
                  <div className="label">{t('actors.address')}</div>
                  <div style={{ fontSize: '0.82rem' }}>{row.office_address}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const cardStyleBase = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  overflow: 'hidden',
};
