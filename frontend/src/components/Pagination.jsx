/**
 * Reusable pagination component
 * @param {{ page: number, totalPages: number, total: number, onPageChange: (n: number) => void, noun?: string }} props
 */
export function Pagination({ page, totalPages, total, onPageChange, noun = 'record' }) {
  if (totalPages <= 1) return null;

  const maxButtons = 5;
  let start = Math.max(0, page - Math.floor(maxButtons / 2));
  let end = start + maxButtons;
  if (end > totalPages) { end = totalPages; start = Math.max(0, end - maxButtons); }

  const pages = [];
  for (let i = start; i < end; i++) pages.push(i);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', padding: '1.5rem 0' }}>
      <button
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        style={navBtn(page === 0)}
        aria-label="Previous page"
      >
        ← Prev
      </button>

      {start > 0 && (
        <>
          <button onClick={() => onPageChange(0)} style={pageBtn(false)}>1</button>
          {start > 1 && <span style={{ color: 'var(--color-text-muted)', padding: '0 0.2rem' }}>…</span>}
        </>
      )}

      {pages.map((p) => (
        <button key={p} onClick={() => onPageChange(p)} style={pageBtn(p === page)}>
          {p + 1}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: 'var(--color-text-muted)', padding: '0 0.2rem' }}>…</span>}
          <button onClick={() => onPageChange(totalPages - 1)} style={pageBtn(false)}>{totalPages}</button>
        </>
      )}

      <button
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        style={navBtn(page >= totalPages - 1)}
        aria-label="Next page"
      >
        Next →
      </button>

      <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginLeft: '0.75rem' }}>
        {total} {total === 1 ? noun : `${noun}s`}
      </span>
    </div>
  );
}

function navBtn(disabled) {
  return {
    padding: '0.4rem 0.8rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: 'var(--color-surface)',
    color: disabled ? 'var(--color-border)' : 'var(--color-text)',
    cursor: disabled ? 'default' : 'pointer',
    fontWeight: 500,
    fontSize: '0.85rem',
    opacity: disabled ? 0.5 : 1,
  };
}

function pageBtn(active) {
  return {
    minWidth: '34px',
    padding: '0.4rem 0.5rem',
    border: active ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
    color: active ? '#fff' : 'var(--color-text)',
    cursor: 'pointer',
    fontWeight: active ? 700 : 400,
    fontSize: '0.85rem',
  };
}
