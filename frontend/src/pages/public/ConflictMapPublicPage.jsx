import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API = '/api';
const INTENSITY_COLORS = { low: '#86efac', medium: '#fde047', high: '#f97316', critical: '#dc2626' };
const INTENSITY_BG = { low: '#dcfce7', medium: '#fefce8', high: '#fff7ed', critical: '#fef2f2' };

/** Approximate centre coordinates for each of Plateau State's 17 LGAs */
const LGA_COORDS = {
  'Barkin Ladi': [9.5333, 8.9000],
  'Bassa':       [9.9333, 8.7333],
  'Bokkos':      [9.3000, 8.9833],
  'Jos East':    [9.7833, 9.0500],
  'Jos North':   [9.9167, 8.8833],
  'Jos South':   [9.8000, 8.8500],
  'Kanam':       [9.6000, 9.6333],
  'Kanke':       [9.4333, 9.4167],
  'Langtang North': [9.1333, 9.7833],
  'Langtang South': [8.9667, 9.8000],
  'Mangu':       [9.5167, 9.0833],
  'Mikang':      [8.8833, 9.5833],
  'Pankshin':    [9.3333, 9.4333],
  "Qua'an Pan":  [8.9667, 9.2833],
  'Riyom':       [9.6167, 8.7500],
  'Shendam':     [8.8833, 9.5333],
  'Wase':        [9.0833, 9.9333],
};

const PLATEAU_CENTER = [9.35, 9.25];
const DEFAULT_ZOOM = 8;

/** Build a coloured circle SVG marker */
function makeIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <circle cx="14" cy="14" r="12" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="14" cy="14" r="5" fill="#fff" opacity="0.7"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/** Helper component — fly the map to a location when it changes */
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? 11, { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

function getMaxIntensity(incidents) {
  if (!incidents.length) return null;
  const order = ['low', 'medium', 'high', 'critical'];
  let max = 0;
  for (const i of incidents) {
    const idx = order.indexOf(i.intensity);
    if (idx > max) max = idx;
  }
  return order[max];
}

export function ConflictMapPublicPage() {
  const { t } = useTranslation();
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLga, setSelectedLga] = useState(null);
  const markerRefs = useRef({});

  useEffect(() => {
    fetch(`${API}/conflict/map-data`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setMapData)
      .catch(() => setMapData({}))
      .finally(() => setLoading(false));
  }, []);

  const lgas = useMemo(() => (mapData ? Object.keys(mapData) : []), [mapData]);

  const flyTarget = useMemo(() => {
    if (!selectedLga || !LGA_COORDS[selectedLga]) return null;
    return LGA_COORDS[selectedLga];
  }, [selectedLga]);

  /** When a card is clicked, fly to the marker and open its popup */
  function handleLgaClick(lga) {
    setSelectedLga(lga);
    setTimeout(() => {
      const m = markerRefs.current[lga];
      if (m) m.openPopup();
    }, 900);
  }

  if (loading) {
    return (
      <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
        {t('conflict_map.loading')}
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem', paddingBottom: '3rem' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>{t('conflict_map.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        {t('conflict_map.description')}
      </p>

      {/* ── Interactive Map ── */}
      <section style={{ borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)', marginBottom: '1.5rem', border: '1px solid var(--color-border)' }}>
        <MapContainer
          center={PLATEAU_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: '420px', width: '100%', background: '#e8e4df' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo center={flyTarget} zoom={11} />
          {Object.entries(LGA_COORDS).map(([lga, coords]) => {
            const d = mapData?.[lga];
            const incidents = d?.incidents || [];
            const maxIntensity = getMaxIntensity(incidents);
            const color = maxIntensity ? INTENSITY_COLORS[maxIntensity] : '#94a3b8';
            const incidentCount = incidents.reduce((sum, i) => sum + (i.count || 0), 0);
            const actorCount = d?.actorsCount ?? 0;
            return (
              <Marker
                key={lga}
                position={coords}
                icon={makeIcon(color)}
                ref={(r) => { if (r) markerRefs.current[lga] = r; }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong style={{ fontSize: '1rem' }}>{lga}</strong>
                    <div style={{ marginTop: 4, fontSize: '0.85rem', color: '#555' }}>
                      {t('conflict_map.incidents')} {incidentCount}{maxIntensity ? ` (${maxIntensity})` : ''}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                      {t('conflict_map.peace_actors')} {actorCount}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </section>

      {/* ── Legend ── */}
      <section style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem' }}>{t('conflict_map.legend')}</h2>
        <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>{t('conflict_map.conflict_intensity')}</p>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', listStyle: 'none', margin: 0, padding: 0 }}>
          {['low', 'medium', 'high', 'critical'].map((level) => (
            <li key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 14, height: 14, background: INTENSITY_COLORS[level], borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #ccc' }} aria-hidden />
              <span style={{ textTransform: 'capitalize' }}>{level}</span>
            </li>
          ))}
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: 14, height: 14, background: '#94a3b8', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 0 0 1px #ccc' }} aria-hidden />
            <span>{t('conflict_map.no_data')}</span>
          </li>
        </ul>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{t('conflict_map.peacebuilding_text')}</p>
      </section>

      {/* ── LGA Cards ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(12rem, 1fr))', gap: '0.75rem' }}>
        {lgas.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>{t('conflict_map.no_data_available')}</p>
        ) : (
          lgas.map((lga) => {
            const d = mapData[lga];
            const incidents = d?.incidents || [];
            const maxIntensity = getMaxIntensity(incidents);
            const color = maxIntensity ? INTENSITY_COLORS[maxIntensity] : 'var(--color-border)';
            const bg = maxIntensity ? INTENSITY_BG[maxIntensity] : undefined;
            const actorCount = d?.actorsCount ?? 0;
            const incidentCount = incidents.reduce((sum, i) => sum + (i.count || 0), 0);
            const isSelected = selectedLga === lga;
            return (
              <div
                key={lga}
                role="button"
                tabIndex={0}
                onClick={() => handleLgaClick(lga)}
                onKeyDown={(e) => e.key === 'Enter' && handleLgaClick(lga)}
                style={{
                  background: isSelected ? (bg || 'var(--color-surface)') : 'var(--color-surface)',
                  borderLeft: `4px solid ${color}`,
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  boxShadow: isSelected ? '0 0 0 2px var(--color-primary)' : 'var(--shadow)',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s, background 0.2s',
                }}
              >
                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>{lga}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {t('conflict_map.incidents')} {incidentCount}
                  {maxIntensity && ` (${maxIntensity})`}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t('conflict_map.actors')} {actorCount}</div>
              </div>
            );
          })
        )}
      </section>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
        <Link to="/">{t('conflict_map.back_home')}</Link>
      </p>
    </div>
  );
}
