import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { usePopoverAnchor } from './use-popover-anchor';
import './multi-select.css';
import './multi-select-popover.css';

/** Roughly how tall the popover gets — search box plus a full list. Only used to decide whether
 *  it still fits under the trigger, so an approximation is enough. */
const POPOVER_MAX_HEIGHT = 290;

export type MultiSelectOption = {
  value: string;
  label: string;
  icon?: string;
  colour?: string;
  hint?: string;
};

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  /** Shown as a row above the list when given; toggles every option the search leaves visible. */
  markAllLabel?: string;
  /** 'large' matches the add forms, whose fields are drawn a size up. The popover is portalled to
   *  <body>, so no scope the form sets can reach it — it has to be told. */
  size?: 'default' | 'large';
};

/** A searchable dropdown that lets the user pick several options at once (checkbox list). */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  markAllLabel,
  size = 'default',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { rect, rootRef, triggerRef, popoverRef } = usePopoverAnchor(open, setOpen, POPOVER_MAX_HEIGHT);


  const selectedSet = new Set(selected);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  function toggle(value: string) {
    onChange(selectedSet.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const allMarked = filtered.length > 0 && filtered.every((o) => selectedSet.has(o.value));

  function toggleAll() {
    const values = filtered.map((o) => o.value);
    if (allMarked) {
      const drop = new Set(values);
      onChange(selected.filter((value) => !drop.has(value)));
      return;
    }
    onChange([...selected, ...values.filter((value) => !selectedSet.has(value))]);
  }

  const chosen = options.filter((o) => selectedSet.has(o.value));
  const triggerLabel = selected.length === 0 ? placeholder : chosen.map((o) => o.label).join(', ');
  const swatches = chosen.filter((o) => o.colour);

  return (
    <div className="multi-select" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="multi-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {swatches.length > 0 && (
          <span className="multi-select-dots" aria-hidden="true">
            {swatches.map((option) => (
              <span key={option.value} className="multi-select-dot" style={{ background: option.colour }} />
            ))}
          </span>
        )}
        <span className={selected.length === 0 ? 'multi-select-value placeholder' : 'multi-select-value'}>{triggerLabel}</span>
        {selected.length > 0 && <span className="multi-select-count">{selected.length}</span>}
        <span className="multi-select-caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={popoverRef}
            className={size === 'large' ? 'multi-select-popover multi-select-popover-lg' : 'multi-select-popover'}
            style={{ top: rect.top, left: rect.left, width: rect.width }}
          >
          <input
            className="multi-select-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            autoFocus
          />
          {markAllLabel && filtered.length > 0 && (
            <button
              type="button"
              className={allMarked ? 'multi-select-option multi-select-all checked' : 'multi-select-option multi-select-all'}
              onClick={toggleAll}
            >
              <span className="multi-select-check" aria-hidden="true">
                {allMarked ? '✓' : ''}
              </span>
              <span className="multi-select-option-label">{markAllLabel}</span>
              <span className="multi-select-hint">{filtered.length}</span>
            </button>
          )}

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
                  {option.colour && (
                    <span
                      className="multi-select-dot"
                      style={{ background: option.colour }}
                      aria-hidden="true"
                    />
                  )}
                  {option.icon && <img src={option.icon} className="multi-select-icon" alt="" />}
                  <span className="multi-select-option-label">{option.label}</span>
                  {option.hint && <span className="multi-select-hint">{option.hint}</span>}
                </button>
              ))
            )}
          </div>
          </div>,
          document.body
        )}
    </div>
  );
}
