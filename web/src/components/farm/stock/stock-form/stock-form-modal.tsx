import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { createStockWithSeed, updateStock } from '@/services/stock-service';
import type { Seed } from '@/types/seed';
import type { Stock } from '@/types/stock';
import { isFormComplete, makeInitialValues, parseAmount, type StockFormValues } from './stock-form';
import { StockFormFields } from './stock-form-fields';

type Props = {
  open: boolean;
  editingStock: Stock | null;
  onClose: () => void;
  onSaved: (stock: Stock, isNew: boolean, seed?: Seed) => void;
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
      const { stock, seed } = await createStockWithSeed({
        type: values.type,
        name,
        amount,
        unit: values.unit,
        seedAmount: parseAmount(values.seedAmount),
        seedUnit: values.seedUnit,
      });
      onSaved(stock, true, seed);
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

      <StockFormFields
        open={open}
        isEditing={isEditing}
        values={values}
        formError={formError}
        setField={setField}
      />

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
