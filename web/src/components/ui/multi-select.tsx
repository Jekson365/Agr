import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import './multi-select.css';

/** Roughly how tall the popover gets — search box plus a full list. Only used to decide whether
 *  it still fits under the trigger, so an approximation is enough. */
const POPOVER_MAX_HEIGHT = 290;

export type MultiSelectOption = { value: string; label: string; icon?: string };

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
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
  size = 'default',
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // The popover is portalled out of the control, so it is no longer inside rootRef and has to
      // be asked about separately — without this, clicking an option would close the list first.
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
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

  /*
   * Portalled to <body> and positioned from the trigger's box, so a modal card with
   * overflow-y:auto cannot clip it — the same treatment kind-dropdown.tsx needed, and for the
   * same reason. Placed on layout rather than in an effect, so it never paints at the wrong spot
   * first.
   */
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const box = trigger.getBoundingClientRect();

      // Flip above the field when there is not room under it.
      const below = window.innerHeight - box.bottom;
      const top =
        below < POPOVER_MAX_HEIGHT && box.top > below ? box.top - POPOVER_MAX_HEIGHT - 6 : box.bottom + 6;
      setRect({ top: Math.max(8, top), left: box.left, width: box.width });
    }

    place();
    // Capture phase, so it follows the trigger when an ancestor scrolls rather than only the page.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
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
        ref={triggerRef}
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
          </div>,
          document.body
        )}
    </div>
  );
}
