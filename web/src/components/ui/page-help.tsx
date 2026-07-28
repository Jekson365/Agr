import { useEffect, useRef, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

import mascot from '@/assets/mascot/mascot-guide.png';
import { PAGE_HELP } from '@/config/page-help';
import { useLanguage } from '@/contexts/language-context';
import './page-help.css';

/**
 * Floating mascot in the bottom-right corner; hovering it (or, on touch, tapping
 * it) pops a speech bubble above the character with a short guide for the page
 * the user is currently on. Click toggles a "pinned" open state so the bubble
 * stays up after the pointer leaves. Replaces the old topbar question-mark button.
 */
export function PageHelp() {
  const location = useLocation();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const entry = PAGE_HELP.find(({ pattern }) => matchPath(pattern, location.pathname));

  // Collapse the bubble whenever the route changes so it never lingers with
  // stale guidance from the previous page.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on Escape or a click outside the mascot.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!entry) return null;

  return (
    <div className="page-help" ref={rootRef} data-open={open}>
      <div className="page-help-bubble" role="tooltip" aria-hidden={!open}>
        <div className="page-help-title">{t('help.heading')}</div>
        <p className="page-help-text">{t(`help.${entry.key}`)}</p>
      </div>
      <button
        type="button"
        className="page-help-btn"
        aria-label={t('help.heading')}
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="page-help-hint" aria-hidden="true">
          ?
        </span>
        <img src={mascot} alt="" className="page-help-mascot" draggable={false} />
      </button>
    </div>
  );
}
