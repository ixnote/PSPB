import { useEffect, useRef } from 'react';

/**
 * Reusable modal dialog overlay.
 *
 * Props:
 *  - isOpen    (bool)    show / hide the modal
 *  - onClose   (fn)      called when user clicks backdrop, X, or presses Escape
 *  - title     (string)  heading shown at the top
 *  - width     (string)  max-width of the panel, default '720px'
 *  - children  (node)    modal body content
 */
export function Modal({ isOpen, onClose, title, width = '720px', children }) {
  const overlayRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
        padding: '3vh 1rem',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 'var(--radius, 8px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          width: '100%',
          maxWidth: width,
          position: 'relative',
          animation: 'modalSlideIn 0.2s ease-out',
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--color-border, #e5e7eb)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.4rem',
              lineHeight: 1,
              cursor: 'pointer',
              color: 'var(--color-text-muted, #888)',
              padding: '0.25rem',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.25rem' }}>
          {children}
        </div>

        {/* keyframe animation */}
        <style>{`
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-12px) scale(0.97); }
            to   { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
