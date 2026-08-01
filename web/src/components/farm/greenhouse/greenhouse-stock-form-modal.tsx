import { useEffect, useState } from 'react';

import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_OPTIONS } from '@/config/seed-kinds';
import { STOCK_UNIT_OPTIONS, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createGreenhouseStockWithSeed, updateGreenhouseStock } from '@/services/greenhouse-stock-service';
import { createStockKind, getStockKinds } from '@/services/stock-kind-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import type { SeedUnit } from '@/types/seed';
import type { StockType, StockUnit } from '@/types/stock';
import type { StockKind } from '@/types/stock-kind';

type Props = {
  open: boolean;
  editingStock: GreenhouseStock | null;
  /** The greenhouses on the farm. Not offered as a choice — a new row is recorded under the first
   *  of them — but a row has to be recorded under one, so an empty list is worth saying. */
  greenhouses: Greenhouse[];
  /** The rows that already exist, so a name another one carries is caught before saving. */
  existingItems: GreenhouseStock[];
  onClose: () => void;
  onSaved: (stock: GreenhouseStock, isNew: boolean) => void;
};

export function GreenhouseStockFormModal({
  open,
  editingStock,
  greenhouses,
  existingItems,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<StockKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [kindError, setKindError] = useState<string | null>(null);
  const [stockType, setStockType] = useState<StockType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<StockUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // The greenhouse seed for the same crop, always created alongside new stock — a crop arrives as
  // both the seed you sow and the produce bucket it ends up in.
  const [seedAmountInput, setSeedAmountInput] = useState('');
  const [seedUnit, setSeedUnit] = useState<SeedUnit>('Kilogram');

  const isEditing = editingStock != null;
  /**
   * Which greenhouse the row is recorded under. Not a choice any more: a good added anywhere is
   * usable from every greenhouse, so picking one only decided where its card said it was kept.
   * An existing row keeps the one it has; a new one is recorded under the first greenhouse.
   */
  const greenhouseId = editingStock?.greenhouseId ?? greenhouses[0]?.id ?? null;

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
  }, [open, editingStock, greenhouses]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      // The same crop catalog as field stock — a tomato is a tomato wherever it's grown.
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

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const seedAmount = Math.max(0, parseFloat(seedAmountInput) || 0);
  const canSubmit = stockType.trim() !== '' && greenhouseId != null && !saving;

  /**
   * Whether another row already carries this label — in any greenhouse, since the page lists them
   * all together. A blank name isn't a label: those rows show their crop's name instead, and any
   * number of them may exist.
   */
  function isNameTaken(name: string): boolean {
    const trimmed = name.trim().toLowerCase();
    if (trimmed === '') {
      return false;
    }
    return existingItems.some((item) => item.id !== editingStock?.id && item.name.trim().toLowerCase() === trimmed);
  }

  async function handleSubmit() {
    if (!canSubmit || greenhouseId == null) return;

    if (isNameTaken(nameInput)) {
      setFormError(t('greenhouse.stockNameDuplicate'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = nameInput.trim();
      if (isEditing) {
        const updated: GreenhouseStock = { ...editingStock, greenhouseId, type: stockType, name, amount, unit };
        await updateGreenhouseStock(updated.id, updated);
        onSaved(updated, false);
        onClose();
        return;
      }

      // One call makes the stock and its seed together, so a failure leaves neither behind.
      const { stock } = await createGreenhouseStockWithSeed({
        greenhouseId,
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
      // The server rejects a name another row already carries — one added from another session,
      // say, which the check above couldn't have known about.
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('greenhouse.stockNameDuplicate'));
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
        {/* Nothing to pick: a good is usable from every greenhouse — see greenhouseId. Only the
            case of having no greenhouse at all is worth saying, since there is then nothing to
            record it under. */}
        {greenhouses.length === 0 && <p className="limit-hint">{t('greenhouse.addFirst')}</p>}

        <div className="field">
          <label>{t('farm.type')}</label>
          <KindPicker
            options={kinds.map((k) => ({ value: k.name, label: stockTypeLabel(k.name, t), icon: stockKindImage(k.name) }))}
            selected={stockType}
            onSelect={setStockType}
            onAddNew={handleAddKind}
            addPlaceholder={t('farm.newStockTypePlaceholder')}
            loading={kindsLoading}
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

        {/* Every new greenhouse stock gets its seed too, so the two never drift apart. Only on
            create — editing shouldn't mint new seed rows. */}
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
    </Modal>
  );
}
