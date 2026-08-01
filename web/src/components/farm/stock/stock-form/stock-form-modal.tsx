import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { Modal } from '@/components/ui/modal';
import { isPlanLimitError } from '@/config/plan-benefits';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY, STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { getRecordedStockIds } from '@/services/harvest-service';
import { createStockWithSeed, updateStock } from '@/services/stock-service';
import type { Stock } from '@/types/stock';
import { isFormComplete, makeInitialValues, parseAmount, type StockFormValues } from './stock-form';
import { STOCK_KIND_CATALOG } from './stock-kind-catalog';
import { StockSeedFields } from './stock-seed-fields';
import { UnitChips } from './unit-chips';

type Props = {
  open: boolean;
  editingStock: Stock | null;
  onClose: () => void;
  onSaved: (stock: Stock, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

/** Add or edit a plant stock. A new one is created together with its crop's seed; an edit only
 * touches the stock itself. */
export function StockFormModal({ open, editingStock, onClose, onSaved, onLimitReached }: Props) {
  const { t } = useLanguage();

  const [values, setValues] = useState<StockFormValues>(() => makeInitialValues(editingStock));
  /**
   * Whether a harvest already records this stock — planned or picked. Such a harvest is written in
   * the good's own terms: its plan reads back the stock's unit, and its results moved the balance
   * by that many of them. Both are settled from then on. Read when the form opens rather than taken
   * from the list behind it, since a harvest may have been recorded since that was loaded.
   */
  const [kindLocked, setKindLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setValues(makeInitialValues(editingStock));
    setFormError(null);
    setKindLocked(false);
    loadRecordedState(editingStock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

  /**
   * Whether this stock is already recorded by a harvest. Only an existing row can be — a new one
   * has no history — and a failed read leaves the fields open, since the server refuses the change
   * anyway if it turns out there is one.
   */
  async function loadRecordedState(stock: Stock | null) {
    if (stock == null) return;
    try {
      const recorded = await getRecordedStockIds();
      setKindLocked(recorded.includes(stock.id));
    } catch {
      setKindLocked(false);
    }
  }

  const setField = <K extends keyof StockFormValues>(key: K, value: StockFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = isFormComplete(values) && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const name = values.name.trim();
      const amount = parseAmount(values.amount);

      if (isEditing) {
        // A recorded row keeps the kind and unit it came in with — those fields only show them back.
        const updated: Stock = {
          ...editingStock,
          type: kindLocked ? editingStock.type : values.type,
          name,
          amount,
          unit: kindLocked ? editingStock.unit : values.unit,
        };
        await updateStock(updated.id, updated);
        onSaved(updated, false);
        onClose();
        return;
      }

      // One call makes the stock and its seed together, so a failure leaves neither behind.
      const { stock } = await createStockWithSeed({
        type: values.type,
        name,
        amount,
        unit: values.unit,
        seedAmount: parseAmount(values.seedAmount),
        seedUnit: values.seedUnit,
      });
      onSaved(stock, true);
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      // The only thing the server refuses with a 409 here: a harvest recorded this stock while the
      // form sat open. Lock the fields and put the recorded kind and unit back.
      if (err instanceof ApiError && err.status === 409 && editingStock != null) {
        setKindLocked(true);
        setValues((prev) => ({ ...prev, type: editingStock.type, unit: editingStock.unit }));
        setFormError(t('farm.stockHarvestedFixed'));
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
        {/* What a recorded harvest collected is this kind, counted in this unit — see kindLocked.
            Both are shown back rather than offered, with the reason under the unit. */}
        {kindLocked ? (
          <div className="field">
            <label>{t('farm.type')}</label>
            <span className="limit-hint field-fixed-value">
              <img src={stockKindImage(values.type)} className="kind-chip-icon" alt="" />
              {stockTypeLabel(values.type, t)}
            </span>
          </div>
        ) : (
          <KindCatalogField
            open={open}
            catalog={STOCK_KIND_CATALOG}
            value={values.type}
            onChange={(type) => setField('type', type)}
            preset={editingStock?.type ?? null}
            labelText={t('farm.type')}
            addPlaceholder={t('farm.newStockTypePlaceholder')}
          />
        )}

        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('farm.stockNamePlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.amount')}</label>
          <input
            type="number"
            step="0.01"
            value={values.amount}
            onChange={(e) => setField('amount', e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          {kindLocked ? (
            <>
              <span className="limit-hint field-fixed-value">
                {t(STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitKg')}
              </span>
              <span className="limit-hint">{t('farm.stockHarvestedFixed')}</span>
            </>
          ) : (
            <UnitChips options={STOCK_UNIT_OPTIONS} selected={values.unit} onSelect={(unit) => setField('unit', unit)} />
          )}
        </div>

        {!isEditing && (
          <StockSeedFields
            amount={values.seedAmount}
            onAmountChange={(amount) => setField('seedAmount', amount)}
            unit={values.seedUnit}
            onUnitChange={(unit) => setField('seedUnit', unit)}
            stockType={values.type}
          />
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
