import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { imageUrl } from '../../lib/imageUrl';

const API = '/api';
const HERO_IMG = 'hero-about.jpg';
const STORY_IMG = 'about-story.jpg';

export function AboutPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const MISSION = t('about.mission_text');
  const VISION = t('about.vision_text');
  const CORE_VALUES = [
    { key: 'inclusivity', title: t('about.inclusivity'), desc: t('about.inclusivity_desc') },
    { key: 'integrity', title: t('about.integrity'), desc: t('about.integrity_desc') },
    { key: 'collaboration', title: t('about.collaboration'), desc: t('about.collaboration_desc') },
    { key: 'evidence_based', title: t('about.evidence_based'), desc: t('about.evidence_based_desc') },
    { key: 'community_ownership', title: t('about.community_ownership'), desc: t('about.community_ownership_desc') },
    { key: 'gender_sensitivity', title: t('about.gender_sensitivity'), desc: t('about.gender_sensitivity_desc') },
  ];
  const APPROACHES = [
    { key: 'community_dialogue', title: t('about.community_dialogue'), desc: t('about.community_dialogue_desc') },
    { key: 'early_warning', title: t('about.early_warning'), desc: t('about.early_warning_desc') },
    { key: 'policy_advocacy', title: t('about.policy_advocacy'), desc: t('about.policy_advocacy_desc') },
    { key: 'research_learning', title: t('about.research_learning'), desc: t('about.research_learning_desc') },
  ];

  useEffect(() => {
    fetch(`${API}/website/pages/about`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {t('about.loading')}
      </div>
    );
  }

  if (error || !page) {
    return (
      <div style={{ padding: '2rem 1rem', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
        <h1 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{t('about.title')}</h1>
        <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>
          {t('about.fallback_text')}
        </p>
        <p style={{ color: 'var(--color-text-muted)' }}>{t('about.content_updating')}</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* ═══ HERO BANNER ═══ */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: 'min(40vh, 320px)',
          minHeight: 240,
          backgroundImage: `url(${imageUrl(HERO_IMG)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1rem', maxWidth: 'var(--max-width)', margin: '0 auto' }}>
          <h1
            style={{
              color: 'white',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 700,
              margin: '0 0 0.5rem',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            {t('about.title')}
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              margin: 0,
              textShadow: '0 1px 4px rgba(0,0,0,0.4)',
            }}
          >
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '0 1rem' }}>
        {/* ═══ MISSION & VISION ═══ */}
        <section
          style={{
            marginTop: '2.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              borderTop: '4px solid var(--color-primary)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--color-primary)' }}>{t('about.our_mission')}</h2>
            <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.65 }}>{MISSION}</p>
          </div>
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              borderTop: '4px solid var(--color-primary)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--color-primary)' }}>{t('about.our_vision')}</h2>
            <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.65 }}>{VISION}</p>
          </div>
        </section>

        {/* ═══ OUR STORY / WHO WE ARE ═══ */}
        <section style={{ marginTop: '3rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              margin: '0 0 1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            {t('about.our_story')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '2rem',
              alignItems: 'center',
            }}
          >
            <div style={{ order: 1 }}>
              <img
                src={imageUrl(STORY_IMG)}
                alt="PSPBA at work in the communities"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div style={{ order: 2 }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem', color: 'var(--color-text)' }}>{t('about.who_we_are')}</h3>
              <p style={{ margin: 0, color: 'var(--color-text)', lineHeight: 1.7 }}>
                {t('about.story_p1')}
              </p>
              <p style={{ margin: '1rem 0 0', color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                {t('about.story_p2')}
              </p>
            </div>
          </div>
        </section>

        {/* ═══ CORE VALUES ═══ */}
        <section style={{ marginTop: '3rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              margin: '0 0 1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            {t('about.core_values')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {CORE_VALUES.map((v) => (
              <div
                key={v.key}
                style={{
                  padding: '1.25rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  borderLeft: '4px solid var(--color-primary)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.4rem', color: 'var(--color-primary)' }}>{v.title}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ WHAT WE DO / APPROACH ═══ */}
        <section style={{ marginTop: '3rem' }}>
          <h2
            style={{
              fontSize: '1.5rem',
              margin: '0 0 1.5rem',
              paddingBottom: '0.5rem',
              borderBottom: '2px solid var(--color-primary)',
              color: 'var(--color-primary)',
            }}
          >
            {t('about.what_we_do')}
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {APPROACHES.map((a) => (
              <div
                key={a.key}
                style={{
                  padding: '1.5rem',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  borderTop: '3px solid var(--color-primary)',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: 'var(--color-primary)' }}>{a.title}</h3>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ DYNAMIC CONTENT (API) ═══ */}
        {page.body && (
          <section style={{ marginTop: '3rem' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                margin: '0 0 1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--color-primary)',
                color: 'var(--color-primary)',
              }}
            >
              {t('about.learn_more')}
            </h2>
            <div
              className="content-body"
              style={{
                padding: '1.5rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                border: '1px solid var(--color-border)',
                lineHeight: 1.7,
              }}
              dangerouslySetInnerHTML={{ __html: page.body }}
            />
          </section>
        )}

        {/* ═══ CTA ═══ */}
        <section
          style={{
            marginTop: '3rem',
            padding: '2.5rem 2rem',
            background: 'var(--color-primary)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontSize: '1.5rem',
              margin: '0 0 0.75rem',
              color: 'white',
              fontWeight: 700,
            }}
          >
            {t('about.get_involved')}
          </h2>
          <p
            style={{
              margin: '0 0 1.5rem',
              color: 'rgba(255,255,255,0.95)',
              fontSize: '1.05rem',
              maxWidth: 500,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
            }}
          >
            {t('about.get_involved_text')}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
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
              {t('about.contact_us')}
            </Link>
            <Link
              to="/apply"
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
              {t('about.apply_now')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
