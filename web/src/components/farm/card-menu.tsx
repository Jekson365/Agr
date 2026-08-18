import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import './card-menu.css';

type Props = {
  /** Omitted for rows that can only be removed — the entry is then left out of the menu. */
  onEdit?: () => void;
  /** Omitted for rows that can't be removed from their card — the entry is then left out too. */
  onDelete?: () => void;
  /** One more entry, for a card whose action is neither of those — putting removed land back into
   *  use, for instance. Sits under the other two. */
  extra?: { labelKey: string; onSelect: () => void };
};

export function CardMenu({ onEdit, onDelete, extra }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Every entry can be withheld from the same card — a realized animal takes none of them. The
  // trigger goes with them: a ⋮ that opens an empty box reads as something broken.
  if (!onEdit && !onDelete && !extra) {
    return null;
  }

  return (
    <div className="card-menu" ref={ref}>
      <button
        type="button"
        className="card-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Actions"
      >
        ⋮
      </button>
      {open && (
        <div className="card-menu-dropdown">
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              {t('common.edit')}
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className="card-menu-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              {t('common.delete')}
            </button>
          )}
          {extra && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                extra.onSelect();
              }}
            >
              {t(extra.labelKey)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
