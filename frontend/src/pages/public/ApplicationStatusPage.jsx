import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

const API = '/api';

export function ApplicationStatusPage() {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [application, setApplication] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setApplication(null);
    setLoading(true);
    try {
      const res = await fetch(`${API}/applications/status?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('status_page.not_found'));
      setApplication(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem', maxWidth: '32rem' }}>
      <h1>{t('status_page.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('status_page.subtitle')}</p>

      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '1.5rem' }}>
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>}
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('status_page.application_id')}</label>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          placeholder={t('status_page.id_placeholder')}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('status_page.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder={t('status_page.email_placeholder')}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? t('status_page.checking') : t('status_page.check_status')}</button>
      </form>

      {application && (
        <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>{t('status_page.application_number', { id: application.id })}</h2>
          <p><strong>{t('status_page.type')}</strong> {application.type}</p>
          <p><strong>{t('status_page.submitted')}</strong> {new Date(application.created_at).toLocaleDateString()}</p>
          <p><strong>{t('status_page.status')}</strong> {application.status === 'received' ? t('status_page.status_received') : application.status === 'shortlisted' ? t('status_page.status_shortlisted') : application.status === 'rejected' ? t('status_page.status_rejected') : application.status}</p>
        </div>
      )}

      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/apply" style={{ color: 'var(--color-primary)' }}>{t('status_page.back_apply')}</Link>
        {' · '}
        <Link to="/" style={{ color: 'var(--color-primary)' }}>{t('status_page.home')}</Link>
      </p>
    </div>
  );
}
