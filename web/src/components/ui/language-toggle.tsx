import { useEffect, useRef, useState } from 'react';

import { LANGUAGES, useLanguage } from '@/contexts/language-context';
import './language-toggle.css';

function ChevronIcon() {
  return (
    <svg
      className="language-toggle-chevron"
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function LanguageToggle() {
  const { language, languageLabel, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const label = t('language.label');

  return (
    <div className="language-toggle" ref={ref}>
      <button
        type="button"
        className="language-toggle-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {languageLabel}
        <ChevronIcon />
      </button>
      {open && (
        <div className="language-toggle-dropdown" role="menu" aria-label={label}>
          {LANGUAGES.map((item) => (
            <button
              key={item.code}
              type="button"
              role="menuitemradio"
              aria-checked={item.code === language}
              onClick={() => {
                setLanguage(item.code);
                setOpen(false);
              }}
            >
              <span className="language-toggle-code">{item.label}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
