import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const API = '/api';

export function ContactPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [newsletterSent, setNewsletterSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContact(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/website/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setContactSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewsletter(e) {
    e.preventDefault();
    if (!newsletterEmail) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/website/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setNewsletterSent(true);
      setNewsletterEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem', maxWidth: '36rem' }}>
      <h1>{t('contact.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>{t('contact.subtitle')}</p>

      {error && <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>}

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{t('contact.send_message')}</h2>
        {contactSent ? (
          <p style={{ color: 'var(--color-primary)' }}>{t('contact.thank_you')}</p>
        ) : (
          <form onSubmit={handleContact}>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('contact.name')}</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('contact.email')}</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('contact.subject')}</label>
            <input type="text" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>{t('contact.message')}</label>
            <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} required rows={5} style={{ width: '100%', padding: '0.5rem', marginBottom: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? t('contact.sending') : t('contact.send')}</button>
          </form>
        )}
      </section>

      <section style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>{t('contact.newsletter')}</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>{t('contact.subscribe_text')}</p>
        {newsletterSent ? (
          <p style={{ color: 'var(--color-primary)' }}>{t('contact.subscribed')}</p>
        ) : (
          <form onSubmit={handleNewsletter} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} placeholder={t('contact.your_email')} required style={{ flex: '1', minWidth: '12rem', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
            <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{t('contact.subscribe')}</button>
          </form>
        )}
      </section>
    </div>
  );
}
