import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, getAuthHeaders } from '../../hooks/useAuth';
import { Modal } from '../../components/Modal';

/* Roles allowed to upload/manage documents (must match backend requireRole) */
const UPLOAD_ROLES = ['merl', 'strategic_communications', 'ict', 'programme', 'admin'];
const PUBLISH_ROLES = ['merl', 'strategic_communications', 'programme', 'admin'];

const API = '/api';

export function DocumentsPage() {
  const { user } = useAuth();
  const role = user?.role || '';
  const canUpload = UPLOAD_ROLES.includes(role);
  const canPublish = PUBLISH_ROLES.includes(role);

  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState([]);
  const [facets, setFacets] = useState({ projects: [], thematicAreas: [], documentTypes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title: '', project: '', thematic_area: '', document_type: '' });
  const [file, setFile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    project: searchParams.get('project') || '',
    thematic_area: searchParams.get('thematic_area') || '',
    document_type: searchParams.get('type') || '',
  });
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [requestSuccess, setRequestSuccess] = useState(null);

  const loadDocuments = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.project) params.set('project', filters.project);
    if (filters.thematic_area) params.set('thematic_area', filters.thematic_area);
    if (filters.document_type) params.set('type', filters.document_type);
    return fetch(`${API}/kms/documents?${params}`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Unauthorized'))))
      .then(setDocuments);
  }, [filters.q, filters.project, filters.thematic_area, filters.document_type]);

  useEffect(() => {
    fetch(`${API}/kms/documents/facets`, { headers: getAuthHeaders() })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setFacets)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDocuments()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [loadDocuments]);

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) { setError('Select a file'); return; }
    setError('');
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('title', uploadForm.title || file.name);
    if (uploadForm.project) form.append('project', uploadForm.project);
    if (uploadForm.thematic_area) form.append('thematic_area', uploadForm.thematic_area);
    if (uploadForm.document_type) form.append('document_type', uploadForm.document_type);
    try {
      const res = await fetch(`${API}/kms/documents`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      loadDocuments();
      setUploadForm({ title: '', project: '', thematic_area: '', document_type: '' });
      setFile(null);
      setShowUploadForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading documents…</div>;

  return (
    <div className="container" style={{ padding: '1.5rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Documents (KMS)</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
          {canUpload && (
            <button type="button" onClick={() => { setUploadForm({ title: '', project: '', thematic_area: '', document_type: '' }); setFile(null); setShowUploadForm(true); }} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600, cursor: 'pointer' }}>+ Upload Document</button>
          )}
        </div>
      </div>

      <Modal isOpen={showUploadForm} onClose={() => { setShowUploadForm(false); setFile(null); setUploadForm({ title: '', project: '', thematic_area: '', document_type: '' }); }} title="Upload Document">
        {error && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{error}</p>}
        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Title</label>
              <input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Document title"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>File</label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Project</label>
              <input
                value={uploadForm.project}
                onChange={(e) => setUploadForm((f) => ({ ...f, project: e.target.value }))}
                placeholder="Optional"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Thematic area</label>
              <input
                value={uploadForm.thematic_area}
                onChange={(e) => setUploadForm((f) => ({ ...f, thematic_area: e.target.value }))}
                placeholder="Optional"
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Document type</label>
              <select
                value={uploadForm.document_type}
                onChange={(e) => setUploadForm((f) => ({ ...f, document_type: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              >
                <option value="">— Select —</option>
                <option value="report">Report</option>
                <option value="brief">Brief</option>
                <option value="publication">Publication</option>
                <option value="policy">Policy</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={uploading} style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>
            {uploading ? 'Uploading…' : 'Upload (with local backup)'}
          </button>
        </form>
      </Modal>

      <section style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Search & filters</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            placeholder="Keywords"
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', minWidth: '10rem' }}
          />
          <select value={filters.project} onChange={(e) => setFilters((f) => ({ ...f, project: e.target.value }))} style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
            <option value="">All projects</option>
            {facets.projects?.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filters.thematic_area} onChange={(e) => setFilters((f) => ({ ...f, thematic_area: e.target.value }))} style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
            <option value="">All thematic areas</option>
            {facets.thematicAreas?.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filters.document_type} onChange={(e) => setFilters((f) => ({ ...f, document_type: e.target.value }))} style={{ padding: '0.4rem 0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}>
            <option value="">All types</option>
            {facets.documentTypes?.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
      </section>

      {selectedDoc && (
        <section style={{ background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>Document detail</h3>
            <button type="button" onClick={() => setSelectedDoc(null)} style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>Close</button>
          </div>
          <p style={{ margin: '0.25rem 0' }}><strong>Title:</strong> {selectedDoc.title}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Project:</strong> {selectedDoc.project || '—'}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Thematic area:</strong> {selectedDoc.thematic_area || '—'}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Type:</strong> {selectedDoc.document_type || '—'}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Author:</strong> {selectedDoc.author_name || selectedDoc.author_email || '—'}</p>
          <p style={{ margin: '0.25rem 0' }}><strong>Created:</strong> {new Date(selectedDoc.created_at).toLocaleString()}</p>
          {selectedDoc.versions?.length > 0 && (
            <>
              <p style={{ margin: '0.5rem 0 0.25rem' }}><strong>Version history:</strong></p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {selectedDoc.versions.map((v) => (
                  <li key={v.id}>v{v.version_number} — {new Date(v.created_at).toLocaleString()}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Repository</h2>
        {requestSuccess && <p style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>Request submitted. An admin can approve in Approvals.</p>}
        {documents.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No documents yet. Upload one above or adjust filters.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {documents.map((d) => (
              <li
                key={d.id}
                style={{
                  background: 'var(--color-surface)',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.5rem',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <div>
                  <strong>{d.title}</strong>
                  {d.project && <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}> · {d.project}</span>}
                  {d.thematic_area && <span style={{ color: 'var(--color-text-muted)' }}> · {d.thematic_area}</span>}
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                    {d.document_type || '—'} · {d.author_name || 'Unknown'} · {new Date(d.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius)',
                    background: d.access_level === 'private' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                    color: d.access_level === 'private' ? '#dc2626' : '#16a34a',
                  }}>{d.access_level === 'private' ? 'Private' : 'Public'}</span>
                  <button type="button" onClick={() => fetch(`${API}/kms/documents/${d.id}`, { headers: getAuthHeaders() }).then((r) => r.json()).then(setSelectedDoc)} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>View detail</button>
                  {canUpload && (
                    <button type="button" onClick={async () => { await fetch(`${API}/kms/documents/${d.id}`, { method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ access_level: d.access_level === 'private' ? 'public' : 'private' }) }); loadDocuments(); }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-border)', background: 'var(--color-bg)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>{d.access_level === 'private' ? 'Make Public' : 'Make Private'}</button>
                  )}
                  {canUpload && !d.published_to_website && (
                    <button type="button" onClick={async () => { try { const r = await fetch(`${API}/website/admin/approvals`, { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_type: 'document', entity_id: d.id }) }); if (r.ok) { setRequestSuccess(d.id); setTimeout(() => setRequestSuccess(null), 3000); } } catch (_) {} }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-accent)', background: 'transparent', color: 'var(--color-accent)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>Request approval</button>
                  )}
                  {canPublish && (
                    <button type="button" onClick={async () => { await fetch(`${API}/website/admin/documents/${d.id}/publish`, { method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ published: !d.published_to_website }) }); loadDocuments(); }} style={{ padding: '0.35rem 0.7rem', border: '1px solid var(--color-primary)', background: d.published_to_website ? 'var(--color-primary)' : 'transparent', color: d.published_to_website ? 'white' : 'var(--color-primary)', borderRadius: 'var(--radius)', fontSize: '0.9rem' }}>{d.published_to_website ? 'On website' : 'Publish to website'}</button>
                  )}
                  {!canPublish && d.published_to_website && (
                    <span style={{ padding: '0.35rem 0.7rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Published</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
