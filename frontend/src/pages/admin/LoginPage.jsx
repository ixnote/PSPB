import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const API = '/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin/dashboard';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      setToken(data.token, data.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f0ede8',
    }}>
      {/* Left decorative panel — hidden on small screens */}
      <div style={{
        flex: '0 0 42%',
        background: 'linear-gradient(160deg, #2d5a3d 0%, #1a3d28 60%, #0f2518 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem 2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}
        className="login-left-panel"
      >
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.06,
          backgroundImage: `radial-gradient(circle at 25% 25%, #fff 1px, transparent 1px), radial-gradient(circle at 75% 75%, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '340px' }}>
          <img
            src="/logo.png"
            alt="PSPBA Logo"
            style={{
              width: '110px', height: '110px', objectFit: 'contain',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
            }}
          />
          <h2 style={{
            color: '#ffffff', fontSize: '1.4rem', fontWeight: 700,
            margin: '0 0 0.5rem', lineHeight: 1.3,
          }}>
            Plateau State Peacebuilding Agency
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem',
            margin: 0, lineHeight: 1.6,
          }}>
            Strengthening Peace, Security &amp; Resilience across Plateau State
          </p>

          {/* Accent line */}
          <div style={{
            width: '50px', height: '3px', borderRadius: '2px',
            background: '#c4a35a', margin: '1.5rem auto 0',
          }} />
        </div>
      </div>

      {/* Right — login form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Mobile logo (hidden on larger screens — shown via className) */}
          <div className="login-mobile-logo" style={{
            display: 'none', textAlign: 'center', marginBottom: '1.5rem',
          }}>
            <img src="/logo.png" alt="PSPBA Logo" style={{ width: '70px', height: '70px', objectFit: 'contain', marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem' }}>PSPBA</div>
          </div>

          {/* Welcome text */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              margin: '0 0 0.35rem', fontSize: '1.65rem', fontWeight: 700,
              color: 'var(--color-text)', letterSpacing: '-0.01em',
            }}>
              Welcome back
            </h1>
            <p style={{
              margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)',
            }}>
              Sign in to access the admin console
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              padding: '0.65rem 0.85rem', marginBottom: '1.25rem',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', color: '#b91c1c',
              fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>!</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block', marginBottom: '0.4rem',
                fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)',
              }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', fontSize: '1rem', pointerEvents: 'none',
                }}>
                  @
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  style={{
                    width: '100%', padding: '0.7rem 0.75rem 0.7rem 2.25rem',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '8px', fontSize: '0.95rem',
                    background: '#ffffff',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45,90,61,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block', marginBottom: '0.4rem',
                fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-text)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  style={{
                    width: '100%', padding: '0.7rem 2.75rem 0.7rem 0.75rem',
                    border: '1.5px solid var(--color-border)',
                    borderRadius: '8px', fontSize: '0.95rem',
                    background: '#ffffff',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--color-primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(45,90,61,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--color-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  style={{
                    position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', padding: '0.25rem',
                    color: 'var(--color-text-muted)', fontSize: '0.8rem', cursor: 'pointer',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.75rem',
                background: loading ? '#5a8a6a' : 'var(--color-primary)',
                color: '#ffffff', border: 'none',
                borderRadius: '8px', fontWeight: 700, fontSize: '1rem',
                cursor: loading ? 'wait' : 'pointer',
                transition: 'background 0.2s, transform 0.1s',
                boxShadow: '0 2px 8px rgba(45,90,61,0.25)',
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.background = 'var(--color-primary-hover)'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.background = 'var(--color-primary)'; }}
              onMouseDown={(e) => { e.target.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { e.target.style.transform = 'scale(1)'; }}
            >
              {loading ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Back to site link */}
          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <Link
              to="/"
              style={{
                color: 'var(--color-text-muted)', fontSize: '0.88rem',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; }}
            >
              ← Back to public website
            </Link>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', marginTop: '2.5rem',
            fontSize: '0.78rem', color: 'var(--color-text-muted)',
            lineHeight: 1.5,
          }}>
            <div>&copy; {new Date().getFullYear()} Plateau State Peacebuilding Agency</div>
            <div style={{ marginTop: '0.15rem' }}>All rights reserved</div>
          </div>
        </div>
      </div>

      {/* Inline styles for responsive + animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: block !important; }
        }
      `}</style>
    </div>
  );
}
