import { useEffect, useRef } from 'react';

import { TREE_TREATMENTS, treeTreatmentColour, treeTreatmentLabel } from '@/config/tree-treatment';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/timeline/harvest-timeline-day-menu.css';

type Props = {
  x: number;
  y: number;
  assigned: string[];
  onToggle: (type: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function TreatmentDayMenu({ x, y, assigned, onToggle, onClear, onClose }: Props) {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function dismiss(event: Event) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} className="hcal-day-menu trt-menu" style={{ left: x, top: y }} role="menu">
      {TREE_TREATMENTS.map((type) => {
        const active = assigned.includes(type);
        return (
          <button
            key={type}
            type="button"
            className={active ? 'hcal-day-menu-item active' : 'hcal-day-menu-item'}
            role="menuitemcheckbox"
            aria-checked={active}
            onClick={() => onToggle(type)}
          >
            <span
              className="hcal-day-menu-icon trt-swatch"
              style={{ background: treeTreatmentColour(type) }}
              aria-hidden="true"
            />
            <span className="hcal-day-menu-label">{treeTreatmentLabel(type, t)}</span>
            {active && (
              <svg
                className="hcal-day-menu-tick"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4 10-10" />
              </svg>
            )}
          </button>
        );
      })}

      {assigned.length > 0 && (
        <button type="button" className="hcal-day-menu-item danger" role="menuitem" onClick={onClear}>
          <span className="hcal-day-menu-icon" />
          <span className="hcal-day-menu-label">{t('treatment.clearDay')}</span>
        </button>
      )}
    </div>
  );
}
