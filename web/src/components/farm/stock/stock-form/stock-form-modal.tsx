import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { Modal } from '@/components/ui/modal';
import { isPlanLimitError } from '@/config/plan-benefits';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY, STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
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
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setValues(makeInitialValues(editingStock));
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

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
        // Nothing an existing stock shows is on offer, so the row goes back as it came.
        const updated: Stock = { ...editingStock, name, amount };
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
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="stock-form-modal">
      <h2 className="form-title">{isEditing ? t('farm.editStock') : t('farm.addStock')}</h2>

      <div className="form-fields">
        {/* An existing stock is settled: a harvest that recorded it is written in the good's own
            terms — its plan reads back this kind and unit, and its results moved the balance by
            that many of them — and the seed it was created with grows into this crop. So an edit
            shows the row back rather than offering to move it under all of that. */}
        {isEditing ? (
          <div className="field">
            <label>{t('farm.type')}</label>
            <span className="limit-hint field-fixed-value">
              <img src={stockKindImage(values.type)} className="kind-chip-icon" alt="" />
              {stockTypeLabel(values.type, t)}
            </span>
          </div>
        ) : (
          /* A dropdown rather than the chip row: the crop catalog is the one users add to most,
             and past a couple of dozen kinds the row filled the modal before the fields below it. */
          <KindCatalogField
            open={open}
            catalog={STOCK_KIND_CATALOG}
            value={values.type}
            onChange={(type) => setField('type', type)}
            preset={editingStock?.type ?? null}
            labelText={t('farm.type')}
            addPlaceholder={t('farm.newStockTypePlaceholder')}
            variant="dropdown"
            /* Adding a crop type from here is switched off — the catalog is settled, and a type
               invented mid-form lands as a near-duplicate of one already in it. Flip to true to
               bring back both the "New type" button and the add row under a fruitless search. */
            allowAdd={false}
          />
        )}

        {/* The label is how this stock is named everywhere it appears — its plots, its history,
            the harvests that recorded it — so it is settled with the row. */}
        <div className="field">
          <label>{t('farm.name')}</label>
          {isEditing ? (
            <span className="limit-hint field-fixed-value">{values.name.trim() || '—'}</span>
          ) : (
            <input
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={t('farm.stockNamePlaceholder')}
            />
          )}
        </div>

        {/* How much is on hand is the sum of the movements logged against the stock, so it is
            recorded on its history page rather than typed over here — an edit straight to the
            figure would leave the page and the ledger telling two different stories. */}
        <div className="field">
          <label>{t('farm.amount')}</label>
          {isEditing ? (
            <span className="limit-hint field-fixed-value">{values.amount}</span>
          ) : (
            <input
              type="number"
              step="0.01"
              value={values.amount}
              onChange={(e) => setField('amount', e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
            />
          )}
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          {isEditing ? (
            <span className="limit-hint field-fixed-value">
              {t(STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitKg')}
            </span>
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

      {/* Every field an existing stock shows is settled at this point, so there is nothing for a
          Save to write — it reads as what it is, a look at the row. Amounts are recorded on its
          history page. Should a field become editable again, the Add button below covers both
          cases as it did before. */}
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {isEditing ? t('common.close') : t('common.cancel')}
        </button>
        {!isEditing && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            {t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
