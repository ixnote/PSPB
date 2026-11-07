import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const HERO_IMAGE = '/api/website/files/hero-ourwork.jpg';

const PROGRAMME_KEYS = [
  { keyTitle: 'community_dialogue_title', keyDesc: 'community_dialogue_desc', img: '/api/website/files/prog-dialogue.jpg' },
  { keyTitle: 'early_warning_title', keyDesc: 'early_warning_desc', img: '/api/website/files/prog-earlywarning.jpg' },
  { keyTitle: 'youth_women_title', keyDesc: 'youth_women_desc', img: '/api/website/files/prog-youth.jpg' },
  { keyTitle: 'research_title', keyDesc: 'research_desc', img: '/api/website/files/prog-research.jpg' },
  { keyTitle: 'policy_title', keyDesc: 'policy_desc', img: '/api/website/files/prog-advocacy.jpg' },
  { keyTitle: 'psychosocial_title', keyDesc: 'psychosocial_desc', img: '/api/website/files/prog-psychosocial.jpg' },
];

const LGAS = [
  'Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South',
  'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang',
  'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase',
];

export function OurWorkPage() {
  const { t } = useTranslation();
  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    fetch('/api/website/homepage-stats').then((r) => (r.ok ? r.json() : null)).then(setLiveStats);
  }, []);

  const IMPACT_KEYS = [
    { value: liveStats ? `${liveStats.lgasCovered} LGAs` : '–', labelKey: 'coverage' },
    { value: '100+', labelKey: 'dialogues' },
    { value: liveStats ? `${liveStats.peaceActors}+` : '–', labelKey: 'partners_stat' },
    { value: '1000+', labelKey: 'beneficiaries' },
  ];
  return (
    <>
      {/* Hero Banner */}
      <section style={{
        position: 'relative',
        width: '100%',
        height: '45vh',
        minHeight: '320px',
        maxHeight: '420px',
        backgroundImage: `url(${HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          color: 'white',
          padding: '0 1rem',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 700,
            textShadow: '0 2px 12px rgba(0,0,0,0.4)',
          }}>
            {t('our_work.title')}
          </h1>
          <p style={{
            margin: '0.75rem 0 0',
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
            opacity: 0.95,
            maxWidth: '36rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.4,
          }}>
            {t('our_work.subtitle')}
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3rem' }}>
        {/* Programme Overview */}
        <section style={{
          maxWidth: '48rem',
          margin: '0 auto 2.5rem',
          textAlign: 'center',
        }}>
          <p style={{
            margin: 0,
            color: 'var(--color-text-muted)',
            fontSize: '1.05rem',
            lineHeight: 1.75,
          }}>
            {t('our_work.overview_p1')}
          </p>
        </section>

        {/* Thematic Areas / Programme Cards */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{
            fontSize: '1.4rem',
            marginBottom: '1.5rem',
            paddingBottom: '0.5rem',
            borderBottom: '2px solid var(--color-primary)',
            color: 'var(--color-text)',
          }}>
            {t('our_work.programmes_title')}
          </h2>
          <div
            className="ourwork-prog-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '1.5rem',
            }}
          >
            {PROGRAMME_KEYS.map((prog) => (
              <article
                key={prog.keyTitle}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{
                  height: '300px',
                  overflow: 'hidden',
                }}>
                  <img
                    src={prog.img}
                    alt={t(`our_work.${prog.keyTitle}`)}
                    loading="lazy"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <h3 style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1.15rem',
                    color: 'var(--color-primary)',
                    fontWeight: 700,
                  }}>
                    {t(`our_work.${prog.keyTitle}`)}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: 'var(--color-text-muted)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                  }}>
                    {t(`our_work.${prog.keyDesc}`)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Geographic Coverage */}
        <section style={{
          marginBottom: '3rem',
          padding: '2rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(45, 90, 61, 0.08) 0%, rgba(45, 90, 61, 0.12) 100%)',
          borderRadius: 'var(--radius)',
          border: '1px solid rgba(45, 90, 61, 0.15)',
        }}>
          <h2 style={{
            fontSize: '1.3rem',
            marginBottom: '1.25rem',
            color: 'var(--color-primary)',
            textAlign: 'center',
          }}>
            {t('our_work.geographic_coverage')}
          </h2>
          <p style={{
            textAlign: 'center',
            color: 'var(--color-text-muted)',
            marginBottom: '1.5rem',
            fontSize: '0.95rem',
          }}>
            {t('our_work.geographic_desc')}
          </p>
          <div
            className="ourwork-lga-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.6rem 1rem',
              justifyContent: 'center',
              maxWidth: '36rem',
              margin: '0 auto',
            }}
          >
            {LGAS.map((lga) => (
              <span
                key={lga}
                style={{
                  padding: '0.4rem 0.75rem',
                  background: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {lga}
              </span>
            ))}
          </div>
        </section>

        {/* Impact Highlights */}
        <section style={{
          marginBottom: '3rem',
          padding: '1.5rem 1rem',
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius)',
          color: 'white',
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-around',
            alignItems: 'center',
            gap: '1.5rem 2rem',
          }}>
            {IMPACT_KEYS.map((stat) => (
              <div key={stat.labelKey} style={{ textAlign: 'center', minWidth: '100px' }}>
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                  fontWeight: 800,
                  lineHeight: 1,
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '0.8rem',
                  opacity: 0.9,
                  marginTop: '0.2rem',
                }}>
                  {t(`our_work.${stat.labelKey}`)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA - Partner With Us */}
        <section style={{
          padding: '2.5rem 1.5rem',
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius)',
          color: 'white',
          textAlign: 'center',
        }}>
          <h2 style={{
            margin: '0 0 0.75rem',
            fontSize: 'clamp(1.25rem, 3vw, 1.6rem)',
            fontWeight: 700,
          }}>
            {t('our_work.partner_with_us')}
          </h2>
          <p style={{
            margin: '0 0 1.5rem',
            opacity: 0.95,
            fontSize: '1rem',
            maxWidth: '32rem',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.5,
          }}>
            {t('our_work.partner_text')}
          </p>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
          }}>
            <Link
              to="/contact"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.5rem',
                background: 'white',
                color: 'var(--color-primary)',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t('our_work.contact_us')}
            </Link>
            <Link
              to="/partners"
              style={{
                display: 'inline-block',
                padding: '0.65rem 1.5rem',
                border: '2px solid white',
                color: 'white',
                borderRadius: 'var(--radius)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {t('our_work.our_partners')}
            </Link>
          </div>
        </section>
      </div>

      <style>{`
        @media (min-width: 640px) {
          .ourwork-prog-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 480px) {
          .ourwork-lga-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
