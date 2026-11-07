import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuthHeaders } from '../../hooks/useAuth';

const API = '/api';

export function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: 'PATCH',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '1.5rem 1rem', maxWidth: '24rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin/dashboard" style={{ color: 'var(--color-primary)' }}>← Dashboard</Link>
      </div>
      <h1 style={{ marginBottom: '1rem' }}>Change password</h1>
      {success && <p style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Password updated successfully.</p>}
      {error && <p style={{ color: 'var(--color-error)', marginBottom: '1rem' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow)' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Current password</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>New password (min 8 characters)</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>Confirm new password</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }} />
        <button type="submit" disabled={loading} style={{ padding: '0.6rem 1.2rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 'var(--radius)', fontWeight: 600 }}>{loading ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  );
}
