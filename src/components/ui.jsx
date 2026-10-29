import { useEffect } from 'react';

export function WatchLinks({ links }) {
  return (
    <div className="watch" onClick={(e) => e.stopPropagation()}>
      {links.map((l) => (
        <a key={l.name + l.url} className={'btn' + (l.youtube ? ' yt' : '')} href={l.url} target="_blank" rel="noopener noreferrer">
          {l.youtube ? '▶ ' : '📺 '}
          {l.name}
        </a>
      ))}
    </div>
  );
}

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SectionTitle({ children, extra }) {
  return (
    <div className="section-title">
      <h2>{children}</h2>
      {extra}
    </div>
  );
}
