import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_OPTIONS } from '@/config/seed-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { STOCK_UNIT_OPTIONS, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createStockKind, deleteStockKind, getStockKinds } from '@/services/stock-kind-service';
import { createStockWithSeed, updateStock } from '@/services/stock-service';
import type { SeedUnit } from '@/types/seed';
import type { Stock, StockType, StockUnit } from '@/types/stock';
import type { StockKind } from '@/types/stock-kind';

type Props = {
  open: boolean;
  editingStock: Stock | null;
  onClose: () => void;
  onSaved: (stock: Stock, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

export function StockFormModal({ open, editingStock, onClose, onSaved, onLimitReached }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<StockKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [kindError, setKindError] = useState<string | null>(null);
  const [confirmDeleteKind, setConfirmDeleteKind] = useState<{ id: number; label: string } | null>(null);
  const [stockType, setStockType] = useState<StockType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<StockUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The seed for the same crop, always created alongside a new stock — a crop arrives as both the
  // seed you sow and the produce bucket it ends up in.
  const [seedAmountInput, setSeedAmountInput] = useState('');
  const [seedUnit, setSeedUnit] = useState<SeedUnit>('Kilogram');

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setStockType(editingStock?.type ?? '');
    setNameInput(editingStock?.name ?? '');
    setAmountInput(editingStock ? String(editingStock.amount) : '');
    setUnit(editingStock?.unit ?? 'Kilogram');
    setFormError(null);
    setKindError(null);
    setSeedAmountInput('');
    setSeedUnit('Kilogram');
    loadKinds(editingStock?.type ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getStockKinds();
      setKinds(list);
      if (!preset) {
        setStockType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    setKindError(null);

    // A name is a duplicate if it matches an existing kind's raw name OR its localized label —
    // built-in kinds are stored under English keys ("Milk") but displayed translated ("რძე"),
    // and either spelling would show up as a second identical entry in the picker.
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
      // The server rejects names that already exist (e.g. added from another session).
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
      // Don't leave the form pointing at a kind that no longer exists.
      if (deleted && deleted.name === stockType) {
        setStockType(next[0]?.name ?? '');
      }
    } catch (err) {
      // The server refuses to delete a kind that existing stock or seeds still reference.
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeInUse') : t('farm.typeDeleteError'));
    } finally {
      setConfirmDeleteKind(null);
    }
  }

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const seedAmount = Math.max(0, parseFloat(seedAmountInput) || 0);
  const canSubmit = stockType.trim() !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const name = nameInput.trim();
      if (isEditing) {
        const updated: Stock = { ...editingStock, type: stockType, name, amount, unit };
        await updateStock(updated.id, updated);
        onSaved(updated, false);
        onClose();
        return;
      }

      // One call makes the stock and its seed together, so a failure leaves neither behind.
      const { stock } = await createStockWithSeed({
        type: stockType,
        name,
        amount,
        unit,
        seedAmount,
        seedUnit,
      });
      onSaved(stock, true);
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('farm.editStock') : t('farm.addStock')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.type')}</label>
          <KindPicker
            options={kinds.map((k) => ({ value: k.name, label: stockTypeLabel(k.name, t), icon: stockKindImage(k.name) }))}
            selected={stockType}
            onSelect={setStockType}
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
        </div>

        <div className="field">
          <label>{t('farm.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('farm.stockNamePlaceholder')} />
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
            {STOCK_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={unit === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setUnit(opt.value as StockUnit)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Every new stock gets its crop's seed too, so the two never drift apart. Only on create —
            editing a stock shouldn't mint new seed rows. */}
        {!isEditing && (
          <div className="field">
            <label>{t('seed.title')}</label>

            <div className="stock-seed-fields">
              <div className="field">
                <label>{t('seed.amountLabel')}</label>
                <input
                  type="number"
                  step="0.01"
                  value={seedAmountInput}
                  onChange={(e) => setSeedAmountInput(e.target.value)}
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
                      className={seedUnit === opt.value ? 'kind-chip active' : 'kind-chip'}
                      onClick={() => setSeedUnit(opt.value as SeedUnit)}
                    >
                      <span>{t(opt.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <span className="limit-hint">{t('seed.addWithStockHint', { crop: stockTypeLabel(stockType, t) })}</span>
            </div>
          </div>
        )}

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
