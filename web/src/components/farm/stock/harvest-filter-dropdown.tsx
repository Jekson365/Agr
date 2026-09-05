import { useEffect, useRef, useState } from 'react';

import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import './harvest-filter-dropdown.css';

type Props = {
  harvests: Harvest[];
  /** Empty means every harvest counts — the same answer as ticking them all. */
  selected: number[];
  onChange: (selected: number[]) => void;
};

export function HarvestFilterDropdown({ harvests, selected, onChange }: Props) {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const chosen = new Set(selected);
  const shown = selected.length === 0 ? harvests.length : selected.length;

  function toggle(id: number) {
    onChange(chosen.has(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  }

  return (
    <div className="hfd" ref={rootRef}>
      <button
        type="button"
        className="hfd-trigger"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {t('harvest.title')}
        <span className="hfd-count">
          {shown}/{harvests.length}
        </span>
        <span className="hfd-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="hfd-popover">
          {harvests.map((harvest) => (
            <label key={harvest.id} className="hfd-row">
              <input
                type="checkbox"
                checked={selected.length === 0 || chosen.has(harvest.id)}
                onChange={() => toggle(harvest.id)}
              />
              <span className="hfd-row-text">
                <span className="hfd-row-title">{harvest.title}</span>
                <span className="hfd-row-date">{formatIsoDayNumeric(harvest.date)}</span>
              </span>
            </label>
          ))}

          <button
            type="button"
            className="hfd-reset"
            onClick={() => onChange([])}
            disabled={selected.length === 0}
          >
            {t('harvest.filterAll')}
          </button>
        </div>
      )}
    </div>
  );
}
