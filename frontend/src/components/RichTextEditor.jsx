import { useRef, useEffect, useCallback } from 'react';

/**
 * Lightweight rich-text editor built on contentEditable.
 *
 * Props:
 *  - value       (string)   HTML string
 *  - onChange     (fn)       receives updated HTML string
 *  - placeholder  (string)   shown when editor is empty
 *  - minHeight   (string)   e.g. '120px'
 */
export function RichTextEditor({ value, onChange, placeholder = 'Start typing…', minHeight = '120px' }) {
  const editorRef = useRef(null);
  const internalUpdate = useRef(false);

  /* Sync external value into the editor (e.g. when form resets or loads data) */
  useEffect(() => {
    if (internalUpdate.current) {
      internalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (el && el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
    }
  }, [value]);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    internalUpdate.current = true;
    const html = el.innerHTML;
    onChange(html === '<br>' || html === '<div><br></div>' ? '' : html);
  }, [onChange]);

  /* Execute a formatting command */
  function exec(command, val = null) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    emitChange();
  }

  function handleLink() {
    const url = prompt('Enter URL:');
    if (url) exec('createLink', url);
  }

  function handleBlock(tag) {
    exec('formatBlock', tag);
  }

  /* Toolbar button style helper */
  const btn = (active) => ({
    padding: '0.3rem 0.5rem',
    border: '1px solid var(--color-border)',
    background: active ? 'var(--color-primary)' : 'var(--color-bg)',
    color: active ? '#fff' : 'var(--color-text)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    lineHeight: 1,
    fontWeight: 600,
    minWidth: '28px',
    textAlign: 'center',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--color-surface)' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.25rem',
          padding: '0.4rem 0.5rem',
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-border)',
          alignItems: 'center',
        }}
        onMouseDown={(e) => e.preventDefault()} /* prevent losing selection */
      >
        {/* Inline formatting */}
        <button type="button" style={btn()} onClick={() => exec('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" style={btn()} onClick={() => exec('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" style={btn()} onClick={() => exec('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" style={btn()} onClick={() => exec('strikeThrough')} title="Strikethrough">
          <s>S</s>
        </button>

        <span style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 0.25rem' }} />

        {/* Block formatting */}
        <button type="button" style={btn()} onClick={() => handleBlock('p')} title="Paragraph">
          ¶
        </button>
        <button type="button" style={btn()} onClick={() => handleBlock('h2')} title="Heading 2">
          H2
        </button>
        <button type="button" style={btn()} onClick={() => handleBlock('h3')} title="Heading 3">
          H3
        </button>
        <button type="button" style={btn()} onClick={() => handleBlock('h4')} title="Heading 4">
          H4
        </button>
        <button type="button" style={btn()} onClick={() => handleBlock('blockquote')} title="Block quote">
          &ldquo;
        </button>

        <span style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 0.25rem' }} />

        {/* Lists */}
        <button type="button" style={btn()} onClick={() => exec('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" style={btn()} onClick={() => exec('insertOrderedList')} title="Numbered list">
          1. List
        </button>

        <span style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 0.25rem' }} />

        {/* Link */}
        <button type="button" style={btn()} onClick={handleLink} title="Insert link">
          Link
        </button>
        <button type="button" style={btn()} onClick={() => exec('unlink')} title="Remove link">
          ✂
        </button>

        <span style={{ width: '1px', height: '18px', background: 'var(--color-border)', margin: '0 0.25rem' }} />

        {/* Undo / Redo */}
        <button type="button" style={btn()} onClick={() => exec('undo')} title="Undo">
          ↩
        </button>
        <button type="button" style={btn()} onClick={() => exec('redo')} title="Redo">
          ↪
        </button>

        {/* Clear formatting */}
        <button type="button" style={btn()} onClick={() => exec('removeFormat')} title="Clear formatting">
          ✕
        </button>
      </div>

      {/* ── Editable area ── */}
      <div style={{ position: 'relative' }}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          data-placeholder={placeholder}
          style={{
            minHeight,
            padding: '0.75rem',
            outline: 'none',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            color: 'var(--color-text)',
            overflowY: 'auto',
          }}
        />
        <style>{`
          [data-placeholder]:empty::before {
            content: attr(data-placeholder);
            color: var(--color-text-muted, #999);
            pointer-events: none;
            display: block;
          }
          [contenteditable] h2 { font-size: 1.3rem; margin: 0.5em 0 0.25em; }
          [contenteditable] h3 { font-size: 1.15rem; margin: 0.5em 0 0.25em; }
          [contenteditable] h4 { font-size: 1.05rem; margin: 0.5em 0 0.25em; }
          [contenteditable] p  { margin: 0 0 0.5em; }
          [contenteditable] ul, [contenteditable] ol { margin: 0.25em 0 0.5em 1.25em; }
          [contenteditable] blockquote {
            border-left: 3px solid var(--color-primary, #4a7c59);
            margin: 0.5em 0;
            padding: 0.25em 0.75em;
            color: var(--color-text-muted, #555);
          }
          [contenteditable] a { color: var(--color-primary, #4a7c59); }
        `}</style>
      </div>
    </div>
  );
}
