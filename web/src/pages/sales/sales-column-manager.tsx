import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { SALES_COLUMNS, type SalesColumnId } from './sales-columns';
import './sales-columns.css';

type Props = {
  hidden: SalesColumnId[];
  onChange: (hidden: SalesColumnId[]) => void;
};

/** Which columns the table shows, as a checkbox list. The choice is the reader's and is
 *  remembered per browser — see loadHiddenColumns. */
export function SalesColumnManager({ hidden, onChange }: Props) {
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

  const hiddenSet = new Set(hidden);
  const shown = SALES_COLUMNS.length - hidden.length;

  function toggle(id: SalesColumnId) {
    onChange(hiddenSet.has(id) ? hidden.filter((value) => value !== id) : [...hidden, id]);
  }

  return (
    <div className="sales-columns" ref={rootRef}>
      <button
        type="button"
        className="sales-columns-trigger"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {t('sales.columns')}
        <span className="sales-columns-count">
          {shown}/{SALES_COLUMNS.length}
        </span>
        <span className="sales-columns-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="sales-columns-popover">
          {SALES_COLUMNS.map((column) => {
            const checked = !hiddenSet.has(column.id);
            return (
              <label key={column.id} className={column.locked ? 'sales-columns-row locked' : 'sales-columns-row'}>
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={column.locked}
                  onChange={() => toggle(column.id)}
                />
                <span>{t(column.labelKey)}</span>
              </label>
            );
          })}

          <button type="button" className="sales-columns-reset" onClick={() => onChange([])} disabled={hidden.length === 0}>
            {t('sales.columnsShowAll')}
          </button>
        </div>
      )}
    </div>
  );
}
