import { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const PAGE_SIZE = 15;
const INTENSITY_COLORS = { low: '#86efac', medium: '#fde047', high: '#f97316', critical: '#dc2626' };

const LGA_COORDS = {
  'Barkin Ladi': [9.5333, 8.9000], 'Bassa': [9.9333, 8.7333], 'Bokkos': [9.3000, 8.9833],
  'Jos East': [9.7833, 9.0500], 'Jos North': [9.9167, 8.8833], 'Jos South': [9.8000, 8.8500],
  'Kanam': [9.6000, 9.6333], 'Kanke': [9.4333, 9.4167], 'Langtang North': [9.1333, 9.7833],
  'Langtang South': [8.9667, 9.8000], 'Mangu': [9.5167, 9.0833], 'Mikang': [8.8833, 9.5833],
  'Pankshin': [9.3333, 9.4333], "Qua'an Pan": [8.9667, 9.2833], 'Riyom': [9.6167, 8.7500],
  'Shendam': [8.8833, 9.5333], 'Wase': [9.0833, 9.9333],
};
const PLATEAU_CENTER = [9.35, 9.25];

function makeIcon(color, size = 24) {
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`,
    className: '', iconSize: [size, size], iconAnchor: [size/2, size/2], popupAnchor: [0, -size/2],
  });
}

function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom ?? 10, { duration: 0.8 }); }, [center, zoom, map]);
  return null;
}

/* Horizontal bar */
function HBar({ data, maxVal, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: '90px', fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
          <div style={{ flex: 1, height: '16px', background: 'var(--color-bg)', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${(d.count / (maxVal || 1)) * 100}%`, height: '100%', background: color || 'var(--color-primary)', borderRadius: '8px', minWidth: d.count > 0 ? '16px' : 0 }} />
          </div>
          <span style={{ width: '30px', fontSize: '0.78rem', fontWeight: 600, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
        </div>
      ))}
    </div>
  );
}

const inputStyle = { padding: '0.45rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', fontSize: '0.9rem' };

export function ConflictDataPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [list, setList] = useState({ rows: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ lga: '', type: '', from: '', to: '', search: '' });
  const [selectedLga, setSelectedLga] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const markerRefs = useRef({});

  // Load stats
  useEffect(() => {
    fetch(`${API}/conflict/public-stats`).then((r) => r.ok ? r.json() : null).then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Load list
  useEffect(() => {
    setListLoading(true);
    const params = new URLSearchParams();
    if (filters.lga) params.set('lga', filters.lga);
    if (filters.type) params.set('type', filters.type);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.search) params.set('search', filters.search);
    params.set('limit', PAGE_SIZE);
    params.set('offset', page * PAGE_SIZE);
    fetch(`${API}/conflict/public-list?${params}`).then((r) => r.ok ? r.json() : { rows: [], total: 0 }).then(setList).catch(() => {}).finally(() => setListLoading(false));
  }, [filters, page]);

  const totalPages = Math.ceil(list.total / PAGE_SIZE);
  const lgaBarData = useMemo(() => (stats?.byLga || []).slice(0, 10).map((r) => ({ label: r.lga, count: r.count })), [stats]);
  const lgaBarMax = useMemo(() => Math.max(...lgaBarData.map((d) => d.count), 1), [lgaBarData]);
  const typeBarData = useMemo(() => (stats?.byType || []).slice(0, 8).map((r) => ({ label: r.type, count: r.count })), [stats]);
  const typeBarMax = useMemo(() => Math.max(...typeBarData.map((d) => d.count), 1), [typeBarData]);

  const flyTarget = useMemo(() => selectedLga && LGA_COORDS[selectedLga] ? LGA_COORDS[selectedLga] : null, [selectedLga]);

  const uniqueTypes = useMemo(() => {
    const types = (stats?.byType || []).map((r) => r.type).filter(Boolean);
    return types;
  }, [stats]);

  function handleLgaFilter(lga) {
    setFilters((f) => ({ ...f, lga: f.lga === lga ? '' : lga }));
    setSelectedLga(lga);
    setPage(0);
    setTimeout(() => { const m = markerRefs.current[lga]; if (m) m.openPopup(); }, 900);
  }

  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading conflict data…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem 3rem' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>{t('conflict.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.25rem', maxWidth: '700px', lineHeight: 1.5 }}>
        {t('conflict.description')}
      </p>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem', marginBottom: '1.5rem' }}>
        {[
          { label: t('conflict.total_incidents'), value: stats?.totalIncidents ?? 0, color: '#f97316' },
          { label: t('conflict.total_deaths'), value: stats?.totalDeaths ?? 0, color: '#dc2626' },
          { label: t('conflict.total_injured'), value: stats?.totalInjured ?? 0, color: '#eab308' },
          { label: t('conflict.displaced'), value: stats?.totalIdps ?? 0, color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} style={{ background: 'var(--color-surface)', borderLeft: `4px solid ${s.color}`, borderRadius: 'var(--radius)', padding: '0.85rem 1rem', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Map + Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Map */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem 0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>{t('conflict.incident_map')}</div>
          <MapContainer center={PLATEAU_CENTER} zoom={8} style={{ height: '300px', width: '100%' }} scrollWheelZoom>
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <FlyTo center={flyTarget} zoom={10} />
            {Object.entries(LGA_COORDS).map(([lga, coords]) => {
              const lgaData = (stats?.byLga || []).find((r) => r.lga === lga);
              const count = lgaData?.count || 0;
              const size = Math.max(18, Math.min(36, 18 + count * 2));
              const color = count === 0 ? '#94a3b8' : count < 3 ? '#86efac' : count < 6 ? '#fde047' : count < 10 ? '#f97316' : '#dc2626';
              return (
                <Marker key={lga} position={coords} icon={makeIcon(color, size)} ref={(r) => { if (r) markerRefs.current[lga] = r; }}
                  eventHandlers={{ click: () => handleLgaFilter(lga) }}>
                  <Popup><div style={{ minWidth: 140 }}>
                    <strong>{lga}</strong>
                    <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{t('conflict.incidents')} {count}</div>
                    <div style={{ fontSize: '0.85rem' }}>{t('conflict.deaths')} {lgaData?.deaths ?? 0}</div>
                  </div></Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* By LGA chart */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{t('conflict.top_lgas')}</h3>
          {lgaBarData.length > 0 ? <HBar data={lgaBarData} maxVal={lgaBarMax} color="#f97316" /> : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('conflict.no_data')}</p>}
        </div>

        {/* By Type chart */}
        <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem' }}>{t('conflict.incidents_by_type')}</h3>
          {typeBarData.length > 0 ? <HBar data={typeBarData} maxVal={typeBarMax} color="#2d5a3d" /> : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{t('conflict.no_data')}</p>}
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <input type="search" placeholder={t('conflict.search_placeholder')} value={filters.search} onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(0); }} style={{ ...inputStyle, minWidth: '180px' }} />
          <select value={filters.lga} onChange={(e) => { setFilters((f) => ({ ...f, lga: e.target.value })); setPage(0); }} style={inputStyle}>
            <option value="">{t('conflict.all_lgas')}</option>
            {Object.keys(LGA_COORDS).map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filters.type} onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(0); }} style={inputStyle}>
            <option value="">{t('conflict.all_types')}</option>
            {uniqueTypes.map((typeOpt) => <option key={typeOpt} value={typeOpt}>{typeOpt}</option>)}
          </select>
          <input type="date" value={filters.from} onChange={(e) => { setFilters((f) => ({ ...f, from: e.target.value })); setPage(0); }} style={inputStyle} />
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{t('conflict.to')}</span>
          <input type="date" value={filters.to} onChange={(e) => { setFilters((f) => ({ ...f, to: e.target.value })); setPage(0); }} style={inputStyle} />
          {(filters.lga || filters.type || filters.from || filters.to || filters.search) && (
            <button onClick={() => { setFilters({ lga: '', type: '', from: '', to: '', search: '' }); setPage(0); setSelectedLga(null); }} style={{ padding: '0.4rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.85rem', cursor: 'pointer' }}>{t('conflict.clear_filters')}</button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{list.total} {list.total !== 1 ? t('conflict.results') : t('conflict.result')}</span>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', overflowX: 'auto', marginBottom: '1rem' }}>
        {listLoading ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('common.loading')}</div> : list.rows.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('conflict.no_incidents_found')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)' }}>
                {[t('conflict.date'), t('conflict.lga'), t('conflict.district'), t('conflict.type'), t('conflict.place_of_attack'), t('conflict.trigger'), t('conflict.deaths'), t('conflict.injured'), t('conflict.idps'), t('conflict.source'), ''].map((h, i) => (
                  <th key={i} style={{ padding: '0.55rem 0.45rem', textAlign: 'left', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((inc) => (
                <>
                  <tr key={inc.id} style={{ borderBottom: expandedId === inc.id ? 'none' : '1px solid var(--color-border)', cursor: 'pointer', background: expandedId === inc.id ? '#f8f6f3' : 'transparent' }} onClick={() => setExpandedId(expandedId === inc.id ? null : inc.id)}>
                    <td style={{ padding: '0.45rem', whiteSpace: 'nowrap' }}>{inc.incident_date ? new Date(inc.incident_date).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '0.45rem', fontWeight: 500 }}>{inc.lga}</td>
                    <td style={{ padding: '0.45rem', color: 'var(--color-text-muted)' }}>{inc.district || '—'}</td>
                    <td style={{ padding: '0.45rem' }}>{inc.incident_type || '—'}</td>
                    <td style={{ padding: '0.45rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.place_of_attack || '—'}</td>
                    <td style={{ padding: '0.45rem' }}>{Array.isArray(inc.triggers) ? inc.triggers.join(', ') : inc.triggers || '—'}</td>
                    <td style={{ padding: '0.45rem', fontWeight: inc.deaths > 0 ? 700 : 400, color: inc.deaths > 0 ? '#dc2626' : 'inherit' }}>{inc.deaths || 0}</td>
                    <td style={{ padding: '0.45rem' }}>{inc.injured || 0}</td>
                    <td style={{ padding: '0.45rem' }}>{inc.idps || 0}</td>
                    <td style={{ padding: '0.45rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{inc.source || '—'}</td>
                    <td style={{ padding: '0.45rem', fontSize: '0.9rem' }}>{expandedId === inc.id ? '▲' : '▼'}</td>
                  </tr>
                  {expandedId === inc.id && (
                    <tr key={`${inc.id}-detail`} style={{ borderBottom: '1px solid var(--color-border)', background: '#f8f6f3' }}>
                      <td colSpan={11} style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
                          {inc.title && <div><strong>{t('conflict.detail_title')}</strong> {inc.title}</div>}
                          {inc.actor && <div><strong>{t('conflict.detail_actor')}</strong> {inc.actor}</div>}
                          {inc.incident_time && <div><strong>{t('conflict.detail_time')}</strong> {inc.incident_time}</div>}
                          {inc.intensity_level && <div><strong>{t('conflict.detail_intensity')}</strong> <span style={{ padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, background: INTENSITY_COLORS[inc.intensity_level] || '#eee', color: inc.intensity_level === 'critical' || inc.intensity_level === 'high' ? '#fff' : '#333' }}>{inc.intensity_level}</span></div>}
                          {inc.property_destroyed && <div><strong>{t('conflict.detail_property')}</strong> {inc.property_destroyed}</div>}
                          {inc.observation && <div style={{ gridColumn: '1 / -1' }}><strong>{t('conflict.detail_observation')}</strong> {inc.observation}</div>}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      <Pagination page={page} totalPages={totalPages} total={list.total} onPageChange={setPage} noun="incident" />

      <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        {t('conflict.data_source')} <Link to="/map">{t('conflict.view_conflict_map')}</Link>
      </p>
    </div>
  );
}
