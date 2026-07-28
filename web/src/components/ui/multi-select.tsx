import { useEffect, useMemo, useRef, useState } from 'react';

import './multi-select.css';

export type MultiSelectOption = { value: string; label: string; icon?: string };

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
};

/** A searchable dropdown that lets the user pick several options at once (checkbox list). */
export function MultiSelect({ options, selected, onChange, placeholder, searchPlaceholder, emptyText }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
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

  const selectedSet = new Set(selected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function toggle(value: string) {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const triggerLabel =
    selected.length === 0
      ? placeholder
      : options
          .filter((o) => selectedSet.has(o.value))
          .map((o) => o.label)
          .join(', ');

  return (
    <div className="multi-select" ref={rootRef}>
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className={selected.length === 0 ? 'multi-select-value placeholder' : 'multi-select-value'}>{triggerLabel}</span>
        {selected.length > 0 && <span className="multi-select-count">{selected.length}</span>}
        <span className="multi-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="multi-select-popover">
          <input
            className="multi-select-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
          />
          <div className="multi-select-list">
            {filtered.length === 0 ? (
              <p className="multi-select-empty">{emptyText}</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={selectedSet.has(option.value) ? 'multi-select-option checked' : 'multi-select-option'}
                  onClick={() => toggle(option.value)}
                >
                  <span className="multi-select-check" aria-hidden="true">
                    {selectedSet.has(option.value) ? '✓' : ''}
                  </span>
                  {option.icon && <img src={option.icon} className="multi-select-icon" alt="" />}
                  <span className="multi-select-option-label">{option.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
