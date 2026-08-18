import { useEffect, useState } from 'react';

import './kind-picker.css';

export type KindOption = {
  value: string;
  label: string;
  icon?: string;
  /** Whether this one may be deleted from the catalog. Defaults to true; the built-in kinds every
   *  tenant is seeded with set it false, and the server refuses those regardless. */
  removable?: boolean;
};

type Props = {
  options: KindOption[];
  selected: string;
  onSelect: (value: string) => void;
  /** The icon is whatever file the user picked, or null when they added a name alone. */
  onAddNew: (name: string, icon: File | null) => Promise<KindOption | null>;
  addPlaceholder: string;
  loading?: boolean;
  /**
   * When given, each chip gets a remove affordance. The picker only reports the intent — the
   * parent owns the confirmation and the delete itself, since what removal means (and whether
   * it's allowed) belongs to the catalog, not to the picker.
   */
  onRemove?: (value: string) => void;
  removeLabel?: string;
  /**
   * Whether the catalog may be added to from here. Defaults to true. The stock and livestock
   * pickers pass false: those catalogs are settled, and a type invented mid-form ends up as a
   * near-duplicate of one already in the list. `onAddNew` is still wired up so switching a call
   * site back on is the one prop.
   */
  allowAdd?: boolean;
  /** Names the icon input for screen readers and its tooltip. Only read while `allowAdd`
   *  is on, so a picker that only picks may leave it out. */
  iconLabel?: string;
};

/** A chip-row picker that also lets the user type a new name and add it to the catalog on the
 * fly — used for stock/fruit kinds, which aren't a fixed set. New kinds behave exactly like the
 * built-in ones once added. */
export function KindPicker({
  options,
  selected,
  onSelect,
  onAddNew,
  addPlaceholder,
  loading,
  onRemove,
  removeLabel,
  allowAdd = true,
  iconLabel,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  /** The picture for the kind being added, and a local preview of it. A kind added without one
   *  falls back to the catalog's generic artwork, exactly as before. */
  const [newIcon, setNewIcon] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  // Object URLs are held by the document until revoked, so the preview owns its lifetime
  // rather than being minted fresh on every render.
  useEffect(() => {
    if (!newIcon) {
      setIconPreview(null);
      return;
    }
    const url = URL.createObjectURL(newIcon);
    setIconPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newIcon]);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await onAddNew(trimmed, newIcon);
      if (created) {
        onSelect(created.value);
      }
      resetAdd();
    } finally {
      setSaving(false);
    }
  }

  function resetAdd() {
    setNewName('');
    setNewIcon(null);
    setAdding(false);
  }

  if (loading) {
    return <div className="kind-row kind-loading">…</div>;
  }

  return (
    <div className="kind-row">
      {options.map((opt) =>
        // Without removal a chip is a single button, as it has always been. With removal it
        // becomes a wrapper holding two buttons, since a button can't be nested inside a button.
        // A built-in kind takes the plain form even in a picker that offers removal.
        onRemove && opt.removable !== false ? (
          <span key={opt.value} className={opt.value === selected ? 'kind-chip active' : 'kind-chip'}>
            <button type="button" className="kind-chip-select" onClick={() => onSelect(opt.value)}>
              {opt.icon && <img src={opt.icon} className="kind-chip-icon" alt="" />}
              <span>{opt.label}</span>
            </button>
            <button
              type="button"
              className="kind-chip-remove"
              onClick={() => onRemove(opt.value)}
              aria-label={removeLabel ? `${removeLabel}: ${opt.label}` : opt.label}
              title={removeLabel}
            >
              ✕
            </button>
          </span>
        ) : (
          <button
            key={opt.value}
            type="button"
            className={opt.value === selected ? 'kind-chip active' : 'kind-chip'}
            onClick={() => onSelect(opt.value)}
          >
            {opt.icon && <img src={opt.icon} className="kind-chip-icon" alt="" />}
            <span>{opt.label}</span>
          </button>
        )
      )}

      {/* Off wherever allowAdd is false — the row is then the catalog and nothing else. */}
      {allowAdd &&
        (adding ? (
          <div className="kind-add-row">
            {/* Picture first, so the row being built reads the way the chips it joins do. */}
            <label className="kind-add-icon" title={iconLabel}>
              {iconPreview ? (
                <img src={iconPreview} alt="" className="kind-chip-icon" />
              ) : (
                <span aria-hidden>🖼</span>
              )}
              <input
                type="file"
                accept="image/*"
                className="kind-add-icon-input"
                onChange={(e) => setNewIcon(e.target.files?.[0] ?? null)}
              />
              <span className="sr-only">{iconLabel}</span>
            </label>
            <input
              className="kind-add-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={addPlaceholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <button type="button" className="kind-add-confirm" onClick={handleAdd} disabled={saving} aria-label="Confirm">
              ✓
            </button>
            <button
              type="button"
              className="kind-add-cancel"
              onClick={resetAdd}
              aria-label="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="kind-chip-add"
            onClick={() => setAdding(true)}
            aria-label={addPlaceholder}
          >
            +
          </button>
        ))}
    </div>
  );
}
