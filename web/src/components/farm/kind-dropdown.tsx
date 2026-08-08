import { useEffect, useMemo, useRef, useState } from 'react';

import type { KindOption } from '@/components/farm/kind-picker';
import { useLanguage } from '@/contexts/language-context';
/* The name row under the add button is the chip picker's, unchanged — same three controls doing
   the same thing, so it is imported rather than restyled here. */
import './kind-picker.css';
import './kind-dropdown.css';

type Props = {
  options: KindOption[];
  selected: string;
  onSelect: (value: string) => void;
  onAddNew: (name: string) => Promise<KindOption | null>;
  addPlaceholder: string;
  loading?: boolean;
  /** As on the chip picker: the dropdown only reports the intent, the parent owns the delete. */
  onRemove?: (value: string) => void;
  removeLabel?: string;
  /** Whether the catalog may be added to from here — see the same prop on {@link KindPicker}.
   *  With it off the popover is a search over a settled list, and both ways in are gone. */
  allowAdd?: boolean;
};

/**
 * The dropdown form of {@link KindPicker}: one trigger, a search box, and the catalog underneath.
 * Same job as the chip row — pick a kind, add one, delete one — but it stays one field tall no
 * matter how long the catalog grows, which is why the stock form uses it. Catalogs that are still
 * a handful of kinds keep the chips, where every option is visible without a click.
 */
export function KindDropdown({
  options,
  selected,
  onSelect,
  onAddNew,
  addPlaceholder,
  loading,
  onRemove,
  removeLabel,
  allowAdd = true,
}: Props) {
  const { t } = useLanguage();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  /** The button beside the field is up, showing its name input. */
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  /** Which row Enter would take. Counts the add row as the one past the last option. */
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === selected) ?? null;

  const trimmed = query.trim();

  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    return q ? options.filter((opt) => opt.label.toLowerCase().includes(q)) : options;
  }, [options, trimmed]);

  /* Offer the add row only for a name that isn't already in the catalog. Both spellings are
     checked, since a built-in kind is stored under an English key but shown translated and the
     search runs over the label. */
  const canAdd =
    allowAdd &&
    trimmed.length > 0 &&
    !options.some(
      (opt) => opt.label.toLowerCase() === trimmed.toLowerCase() || opt.value.toLowerCase() === trimmed.toLowerCase()
    );

  const rowCount = filtered.length + (canAdd ? 1 : 0);
  const addIndex = canAdd ? filtered.length : -1;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Opening starts on the selected kind, so Enter without touching anything is a no-op rather
  // than a silent jump to whatever sorts first.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    const index = options.findIndex((opt) => opt.value === selected);
    setActiveIndex(index >= 0 ? index : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A narrowed list is a different list; the highlight belongs on its first row.
  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function choose(value: string) {
    onSelect(value);
    setOpen(false);
  }

  /** Shared by the two ways in: the row under a fruitless search, and the button beside the field.
   *  Returns whether the catalog took the name. */
  async function addKind(name: string): Promise<boolean> {
    if (saving) return false;
    setSaving(true);
    try {
      const created = await onAddNew(name);
      // A rejected name (duplicate, or a server that refused) leaves what was typed where it is,
      // with the reason showing under the field, so it can be corrected without retyping.
      if (!created) return false;
      choose(created.value);
      return true;
    } finally {
      setSaving(false);
    }
  }

  async function addFromSearch() {
    if (!canAdd) return;
    await addKind(trimmed);
  }

  async function addFromField() {
    const name = newName.trim();
    if (!name) return;
    if (await addKind(name)) {
      setNewName('');
      setAdding(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (rowCount === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((prev) => (prev + step + rowCount) % rowCount);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex === addIndex) {
        addFromSearch();
      } else if (filtered[activeIndex]) {
        choose(filtered[activeIndex].value);
      }
    }
  }

  return (
    <>
      <div className="kind-dropdown-field">
        <div className="kind-dropdown" ref={rootRef}>
          <button
            type="button"
            className={open ? 'kind-dropdown-trigger open' : 'kind-dropdown-trigger'}
            onClick={() => setOpen((prev) => !prev)}
            disabled={loading}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {selectedOption?.icon && <img src={selectedOption.icon} className="kind-dropdown-icon" alt="" />}
            <span className={selectedOption ? 'kind-dropdown-value' : 'kind-dropdown-value placeholder'}>
              {loading ? '…' : (selectedOption?.label ?? t('farm.typeSelect'))}
            </span>
            <span className="kind-dropdown-caret" aria-hidden="true">
              ▾
            </span>
          </button>

          {open && (
            <div className="kind-dropdown-popover">
              <input
                className="kind-dropdown-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('farm.typeSearchPlaceholder')}
                autoFocus
              />

              <div className="kind-dropdown-list" ref={listRef} role="listbox">
                {filtered.length === 0 && !canAdd ? (
                  <p className="kind-dropdown-empty">{t('farm.typeNoMatches')}</p>
                ) : (
                  filtered.map((opt, index) => {
                    const isSelected = opt.value === selected;
                    return (
                      <div
                        key={opt.value}
                        className={isSelected ? 'kind-dropdown-row selected' : 'kind-dropdown-row'}
                        data-active={index === activeIndex}
                      >
                        <button
                          type="button"
                          className="kind-dropdown-option"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => choose(opt.value)}
                          onMouseEnter={() => setActiveIndex(index)}
                        >
                          <span className="kind-dropdown-check" aria-hidden="true">
                            {isSelected ? '✓' : ''}
                          </span>
                          {opt.icon && <img src={opt.icon} className="kind-dropdown-icon" alt="" />}
                          <span className="kind-dropdown-label">{opt.label}</span>
                        </button>

                        {/* Built-in kinds are what a fresh farm starts from, so they carry no
                            remove — only the ones a user added do. */}
                        {onRemove && opt.removable !== false && (
                          <button
                            type="button"
                            className="kind-dropdown-remove"
                            onClick={() => onRemove(opt.value)}
                            aria-label={removeLabel ? `${removeLabel}: ${opt.label}` : opt.label}
                            title={removeLabel}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* The shortcut for a search that found nothing: add what was typed and take it. */}
              {canAdd && (
                <button
                  type="button"
                  className="kind-dropdown-add"
                  data-active={activeIndex === addIndex}
                  onClick={addFromSearch}
                  onMouseEnter={() => setActiveIndex(addIndex)}
                  disabled={saving}
                  title={addPlaceholder}
                >
                  <span aria-hidden="true">+</span>
                  <span className="kind-dropdown-add-name">{t('farm.typeAddNamed', { name: trimmed })}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* The signposted way in, for someone who knows the kind isn't there yet and would rather
            not search for it first. Off with allowAdd, along with the row inside the popover. */}
        {allowAdd && (
          <button
            type="button"
            className="kind-dropdown-new"
            onClick={() => setAdding((prev) => !prev)}
            disabled={loading}
            aria-expanded={adding}
          >
            <span aria-hidden="true">+</span>
            {t('farm.typeAddNew')}
          </button>
        )}
      </div>

      {allowAdd && adding && (
        <div className="kind-add-row kind-dropdown-new-row">
          <input
            className="kind-add-input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addPlaceholder}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addFromField();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setAdding(false);
                setNewName('');
              }
            }}
          />
          <button
            type="button"
            className="kind-add-confirm"
            onClick={addFromField}
            disabled={saving || newName.trim().length === 0}
            aria-label={t('common.add')}
          >
            ✓
          </button>
          <button
            type="button"
            className="kind-add-cancel"
            onClick={() => {
              setAdding(false);
              setNewName('');
            }}
            aria-label={t('common.cancel')}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
