import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import './card-menu.css';

type Props = {
  /** Omitted for rows that can only be removed — the entry is then left out of the menu. */
  onEdit?: () => void;
  onDelete: () => void;
};

export function CardMenu({ onEdit, onDelete }: Props) {
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
        </div>
      )}
    </div>
  );
}
