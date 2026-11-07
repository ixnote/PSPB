import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const API = '/api';
const TYPES = [
  { id: 'volunteer', labelKey: 'volunteer', path: 'volunteer' },
  { id: 'intern', labelKey: 'intern', path: 'intern' },
  { id: 'consultant', labelKey: 'consultant', path: 'consultant' },
];

export function ApplyPage() {
  const { t } = useTranslation();
  const [activeType, setActiveType] = useState('volunteer');
  const [submitted, setSubmitted] = useState(false);
  const [lastApplicationId, setLastApplicationId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [volunteer, setVolunteer] = useState({ name: '', email: '', phone: '', area_of_interest: '', motivation: '' });
  const [volunteerCv, setVolunteerCv] = useState(null);

  const [intern, setIntern] = useState({ name: '', email: '', phone: '', institution: '', preferred_department: '' });
  const [internCv, setInternCv] = useState(null);

  const [consultant, setConsultant] = useState({ name: '', email: '', phone: '', expertise_area: '' });
  const [consultantFile, setConsultantFile] = useState(null);

  async function handleVolunteer(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData();
    form.append('type', 'volunteer');
    form.append('name', volunteer.name);
    form.append('email', volunteer.email);
    form.append('phone', volunteer.phone);
    form.append('area_of_interest', volunteer.area_of_interest);
    form.append('motivation', volunteer.motivation);
    if (volunteerCv) form.append('attachment', volunteerCv);
    try {
      const res = await fetch(`${API}/applications`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setLastApplicationId(data.id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleIntern(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData();
    form.append('type', 'intern');
    form.append('name', intern.name);
    form.append('email', intern.email);
    form.append('phone', intern.phone);
    form.append('institution', intern.institution);
    form.append('preferred_department', intern.preferred_department);
    if (internCv) form.append('attachment', internCv);
    try {
      const res = await fetch(`${API}/applications`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setLastApplicationId(data.id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConsultant(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData();
    form.append('type', 'consultant');
    form.append('name', consultant.name);
    form.append('email', consultant.email);
    form.append('phone', consultant.phone);
    form.append('expertise_area', consultant.expertise_area);
    if (consultantFile) form.append('attachment', consultantFile);
    try {
      const res = await fetch(`${API}/applications`, { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setLastApplicationId(data.id);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem', maxWidth: '32rem' }}>
        <h1>{t('apply_page.success_title')}</h1>
        <p style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>{t('apply_page.success_text')}</p>
        {lastApplicationId && (
          <p style={{ marginBottom: '1rem' }}>
            <strong>{t('apply_page.application_id', { id: lastApplicationId })}</strong>
          </p>
        )}
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{t('apply_page.confirmation_email')}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {lastApplicationId && <Link to="/application-status" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: 'var(--radius)', fontWeight: 600 }}>{t('apply_page.check_status')}</Link>}
          <Link to="/" style={{ display: 'inline-block', padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius)', fontWeight: 600 }}>{t('apply_page.back_home')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem', maxWidth: '36rem' }}>
      <h1>{t('apply_page.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('apply_page.subtitle')}</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setActiveType(type.id)}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid var(--color-border)',
              background: activeType === type.id ? 'var(--color-primary)' : 'var(--color-surface)',
              color: activeType === type.id ? 'white' : 'var(--color-text)',
              borderRadius: 'var(--radius)',
              fontWeight: 600,
            }}
          >
            {t(`apply_page.${type.labelKey}`)}
          </button>
        ))}
      </div>

      {error && <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>}

      {activeType === 'volunteer' && (
        <form onSubmit={handleVolunteer} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('apply_page.volunteer_application')}</h2>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.name')}</label>
          <input type="text" value={volunteer.name} onChange={(e) => setVolunteer((v) => ({ ...v, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.email')}</label>
          <input type="email" value={volunteer.email} onChange={(e) => setVolunteer((v) => ({ ...v, email: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.phone')}</label>
          <input type="tel" value={volunteer.phone} onChange={(e) => setVolunteer((v) => ({ ...v, phone: e.target.value }))} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.area_of_interest')}</label>
          <input type="text" value={volunteer.area_of_interest} onChange={(e) => setVolunteer((v) => ({ ...v, area_of_interest: e.target.value }))} required placeholder={t('apply_page.interest_placeholder')} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.motivation')}</label>
          <textarea value={volunteer.motivation} onChange={(e) => setVolunteer((v) => ({ ...v, motivation: e.target.value }))} required rows={4} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.cv_optional')}</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setVolunteerCv(e.target.files?.[0] || null)} style={{ width: '100%', marginBottom: '1rem' }} />
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? t('apply_page.submitting') : t('apply_page.submit')}</button>
        </form>
      )}

      {activeType === 'intern' && (
        <form onSubmit={handleIntern} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('apply_page.intern_application')}</h2>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.name')}</label>
          <input type="text" value={intern.name} onChange={(e) => setIntern((i) => ({ ...i, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.email')}</label>
          <input type="email" value={intern.email} onChange={(e) => setIntern((i) => ({ ...i, email: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.phone')}</label>
          <input type="tel" value={intern.phone} onChange={(e) => setIntern((i) => ({ ...i, phone: e.target.value }))} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.institution')}</label>
          <input type="text" value={intern.institution} onChange={(e) => setIntern((i) => ({ ...i, institution: e.target.value }))} required placeholder={t('apply_page.institution_placeholder')} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.preferred_dept')}</label>
          <input type="text" value={intern.preferred_department} onChange={(e) => setIntern((i) => ({ ...i, preferred_department: e.target.value }))} required placeholder={t('apply_page.preferred_dept_placeholder')} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.cv_required')}</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setInternCv(e.target.files?.[0] || null)} required style={{ width: '100%', marginBottom: '1rem' }} />
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? t('apply_page.submitting') : t('apply_page.submit')}</button>
        </form>
      )}

      {activeType === 'consultant' && (
        <form onSubmit={handleConsultant} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('apply_page.consultant_application')}</h2>
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.name')}</label>
          <input type="text" value={consultant.name} onChange={(e) => setConsultant((c) => ({ ...c, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.email')}</label>
          <input type="email" value={consultant.email} onChange={(e) => setConsultant((c) => ({ ...c, email: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.phone')}</label>
          <input type="tel" value={consultant.phone} onChange={(e) => setConsultant((c) => ({ ...c, phone: e.target.value }))} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.expertise_area')}</label>
          <input type="text" value={consultant.expertise_area} onChange={(e) => setConsultant((c) => ({ ...c, expertise_area: e.target.value }))} required placeholder={t('apply_page.expertise_placeholder')} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
          <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('apply_page.cv_proposal')}</label>
          <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setConsultantFile(e.target.files?.[0] || null)} style={{ width: '100%', marginBottom: '1rem' }} />
          <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? t('apply_page.submitting') : t('apply_page.submit')}</button>
        </form>
      )}
    </div>
  );
}
