import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';

const API = '/api';

export function ContentPage() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/website/pages/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('content_page.loading')}</div>;
  if (error || !page) {
    return (
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <p>{t('content_page.not_found')}</p>
        <Link to="/">{t('content_page.back_home')}</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1rem', paddingBottom: '3rem' }}>
      <h1>{page.title}</h1>
      {page.body ? <div className="content-body" style={{ marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: page.body }} /> : <p>{t('content_page.no_content')}</p>}
    </div>
  );
}
