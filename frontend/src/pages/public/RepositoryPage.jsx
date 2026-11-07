import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../../components/Pagination';

const API = '/api';
const PAGE_SIZE = 15;

const searchInputStyle = {
  width: '100%', maxWidth: '400px',
  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
  fontSize: '0.95rem', background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none',
};

const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem',
  border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
  fontSize: '0.95rem', background: 'var(--color-surface)', color: 'var(--color-text)',
};

const labelStyle = { display: 'block', marginBottom: '0.3rem', fontWeight: 600, fontSize: '0.9rem' };

export function RepositoryPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const [requestModal, setRequestModal] = useState(null);
  const [requestForm, setRequestForm] = useState({ name: '', email: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  const fetchDocs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    if (query.trim()) params.set('search', query.trim());
    fetch(`${API}/website/repository?${params}`)
      .then((r) => (r.ok ? r.json() : { rows: [], total: 0 }))
      .then((d) => { setDocs(d.rows || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [page, query]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleSearch = (val) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const tid = setTimeout(() => { setQuery(val); setPage(0); }, 350);
    setSearchTimeout(tid);
  };

  function openRequestModal(doc) {
    setRequestModal(doc);
    setRequestForm({ name: '', email: '', reason: '' });
    setRequestError('');
    setRequestSuccess('');
  }

  async function submitRequest(e) {
    e.preventDefault();
    if (!requestForm.name.trim() || !requestForm.email.trim()) {
      setRequestError('Name and email are required.');
      return;
    }
    setSubmitting(true);
    setRequestError('');
    try {
      const res = await fetch(`${API}/website/repository/${requestModal.id}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setRequestSuccess(data.message || 'Your request has been submitted successfully. You will be contacted via email.');
    } catch (err) {
      setRequestError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem' }}>
      <h1>{t('repository.title')}</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        {t('repository.subtitle')}
        {total > 0 && <span style={{ fontWeight: 600 }}> ({total} {total !== 1 ? t('repository.documents_plural') : t('repository.document')})</span>}
      </p>

      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="search"
          placeholder={t('repository.search_placeholder')}
          defaultValue={query}
          onChange={(e) => handleSearch(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>{t('repository.loading')}</div>
      ) : docs.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>
          {query ? t('repository.no_match') : t('repository.no_documents')}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {docs.map((d) => {
            const isPrivate = d.access_level === 'private';
            return (
              <li key={d.id} style={{
                marginBottom: '0.75rem', padding: '0.75rem 1rem',
                background: 'var(--color-surface)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                  <div>
                    <strong>{d.title}</strong>
                    {isPrivate && (
                      <span style={{
                        marginLeft: '0.5rem', padding: '0.15rem 0.45rem',
                        fontSize: '0.7rem', fontWeight: 600, borderRadius: 'var(--radius)',
                        background: 'rgba(239,68,68,0.12)', color: '#dc2626',
                        verticalAlign: 'middle',
                      }}>Private</span>
                    )}
                    {d.document_type && <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}> · {d.document_type}</span>}
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                {isPrivate ? (
                  <button
                    type="button"
                    onClick={() => openRequestModal(d)}
                    style={{
                      padding: '0.4rem 0.8rem', background: 'transparent', color: 'var(--color-primary)',
                      border: '1px solid var(--color-primary)', borderRadius: 'var(--radius)',
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                    }}
                  >Request Document</button>
                ) : (
                  <a href={`/api/website/repository/${d.id}/download`} download style={{
                    padding: '0.4rem 0.8rem', background: 'var(--color-primary)', color: 'white',
                    borderRadius: 'var(--radius)', fontWeight: 600, textDecoration: 'none',
                  }}>{t('repository.download')}</a>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} noun="document" />

      {requestModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={() => !submitting && setRequestModal(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface)', borderRadius: 'var(--radius)',
              padding: '1.5rem', width: '100%', maxWidth: '460px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem' }}>Request Access</h2>
            <p style={{ margin: '0 0 1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <strong>{requestModal.title}</strong> is a private document. Fill in the form below to request access. The document will be sent to your email upon approval.
            </p>

            {requestSuccess ? (
              <div style={{ padding: '1rem', background: 'rgba(34,197,94,0.1)', borderRadius: 'var(--radius)', color: '#16a34a', fontWeight: 600, marginBottom: '1rem' }}>
                {requestSuccess}
              </div>
            ) : (
              <form onSubmit={submitRequest}>
                {requestError && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{requestError}</p>}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    value={requestForm.name}
                    onChange={(e) => setRequestForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    placeholder="Your full name"
                    style={inputStyle}
                    autoFocus
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelStyle}>Email Address *</label>
                  <input
                    type="email"
                    value={requestForm.email}
                    onChange={(e) => setRequestForm((f) => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelStyle}>Reason / Purpose</label>
                  <textarea
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm((f) => ({ ...f, reason: e.target.value }))}
                    placeholder="Briefly describe why you need this document (optional)"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setRequestModal(null)} disabled={submitting} style={{
                    padding: '0.5rem 1rem', border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)', borderRadius: 'var(--radius)', cursor: 'pointer',
                  }}>Cancel</button>
                  <button type="submit" disabled={submitting} style={{
                    padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
                  }}>{submitting ? 'Submitting...' : 'Submit Request'}</button>
                </div>
              </form>
            )}

            {requestSuccess && (
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setRequestModal(null)} style={{
                  padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer',
                }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
