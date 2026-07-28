import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_OPTIONS } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createStockKind, deleteStockKind, getStockKinds } from '@/services/stock-kind-service';
import { createSeed, updateSeed } from '@/services/seed-service';
import type { Seed, SeedType, SeedUnit } from '@/types/seed';
import type { StockKind } from '@/types/stock-kind';

type Props = {
  open: boolean;
  editingSeed: Seed | null;
  onClose: () => void;
  onSaved: (seed: Seed, isNew: boolean) => void;
};

/** Seed picks its crop from the same catalog as plant stock, so "Tomato seed" and the tomatoes
 * it grows into share a kind, an icon and a label. */
export function SeedFormModal({ open, editingSeed, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<StockKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [kindError, setKindError] = useState<string | null>(null);
  const [confirmDeleteKind, setConfirmDeleteKind] = useState<{ id: number; label: string } | null>(null);
  const [seedType, setSeedType] = useState<SeedType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<SeedUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingSeed != null;

  useEffect(() => {
    if (!open) return;
    setSeedType(editingSeed?.type ?? '');
    setNameInput(editingSeed?.name ?? '');
    setAmountInput(editingSeed ? String(editingSeed.amount) : '');
    setUnit(editingSeed?.unit ?? 'Kilogram');
    setFormError(null);
    setKindError(null);
    loadKinds(editingSeed?.type ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingSeed]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getStockKinds();
      setKinds(list);
      if (!preset) {
        setSeedType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    setKindError(null);

    const candidate = name.trim().toLowerCase();
    const isDuplicate = kinds.some((k) => {
      const label = stockTypeLabel(k.name, t);
      return k.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setKindError(t('farm.typeDuplicate'));
      return null;
    }

    try {
      const created = await createStockKind({ name });
      setKinds((prev) => (prev.some((k) => k.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: stockTypeLabel(created.name, t) };
    } catch (err) {
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeDuplicate') : t('farm.typeSaveError'));
      return null;
    }
  }

  async function confirmDeleteKindNow() {
    if (!confirmDeleteKind) return;
    const { id } = confirmDeleteKind;

    setKindError(null);
    try {
      await deleteStockKind(id);
      const deleted = kinds.find((k) => k.id === id);
      const next = kinds.filter((k) => k.id !== id);
      setKinds(next);
      // Don't leave the form pointing at a crop that no longer exists.
      if (deleted && deleted.name === seedType) {
        setSeedType(next[0]?.name ?? '');
      }
    } catch (err) {
      // The server refuses to delete a kind that existing stock or seeds still reference.
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeInUse') : t('farm.typeDeleteError'));
    } finally {
      setConfirmDeleteKind(null);
    }
  }

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = seedType.trim() !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const name = nameInput.trim();
      if (isEditing) {
        const updated: Seed = { ...editingSeed, type: seedType, name, amount, unit };
        await updateSeed(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createSeed({ type: seedType, name, amount, unit });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('seed.edit') : t('seed.add')}</h2>

      <div className="form-fields">
        {/* The crop is the seed's identity — it's picked once, on the way in. Editing covers the
            variety, amount and unit, so the chooser gives way to a plain read-out of what this
            seed is; switching crop means adding the other one instead. */}
        <div className="field">
          <label>{t('seed.crop')}</label>
          {isEditing ? (
            <div className="seed-crop-readout">
              <img src={stockKindImage(seedType)} alt="" />
              <span>{stockTypeLabel(seedType, t)}</span>
            </div>
          ) : (
            <>
              <KindPicker
                options={kinds.map((k) => ({ value: k.name, label: stockTypeLabel(k.name, t), icon: stockKindImage(k.name) }))}
                selected={seedType}
                onSelect={setSeedType}
                onAddNew={handleAddKind}
                addPlaceholder={t('farm.newStockTypePlaceholder')}
                loading={kindsLoading}
                onRemove={(value) => {
                  const kind = kinds.find((k) => k.name === value);
                  if (kind) setConfirmDeleteKind({ id: kind.id, label: stockTypeLabel(kind.name, t) });
                }}
                removeLabel={t('common.delete')}
              />
              {kindError && <div className="error-banner">{kindError}</div>}
            </>
          )}
        </div>

        <div className="field">
          <label>{t('seed.variety')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('seed.varietyPlaceholder')} />
        </div>

        <div className="field">
          <label>{t('farm.amount')}</label>
          <input
            type="number"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          <div className="kind-row">
            {SEED_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={unit === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setUnit(opt.value as SeedUnit)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>

      <ConfirmDeleteModal
        open={!!confirmDeleteKind}
        name={confirmDeleteKind?.label ?? ''}
        onCancel={() => setConfirmDeleteKind(null)}
        onConfirm={confirmDeleteKindNow}
      />
    </Modal>
  );
}
