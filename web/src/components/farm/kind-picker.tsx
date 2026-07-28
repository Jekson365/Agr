import { useState } from 'react';

import './kind-picker.css';

export type KindOption = { value: string; label: string; icon?: string };

type Props = {
  options: KindOption[];
  selected: string;
  onSelect: (value: string) => void;
  onAddNew: (name: string) => Promise<KindOption | null>;
  addPlaceholder: string;
  loading?: boolean;
  /**
   * When given, each chip gets a remove affordance. The picker only reports the intent — the
   * parent owns the confirmation and the delete itself, since what removal means (and whether
   * it's allowed) belongs to the catalog, not to the picker.
   */
  onRemove?: (value: string) => void;
  removeLabel?: string;
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
}: Props) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed || saving) return;

    setSaving(true);
    try {
      const created = await onAddNew(trimmed);
      if (created) {
        onSelect(created.value);
      }
      setNewName('');
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="kind-row kind-loading">…</div>;
  }

  return (
    <div className="kind-row">
      {options.map((opt) =>
        // Without removal a chip is a single button, as it has always been. With removal it
        // becomes a wrapper holding two buttons, since a button can't be nested inside a button.
        onRemove ? (
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

      {adding ? (
        <div className="kind-add-row">
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
            onClick={() => {
              setAdding(false);
              setNewName('');
            }}
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
      )}
    </div>
  );
}
