import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { fruitTypeLabel, TREE_PRODUCT_DEFAULT_UNIT } from '@/config/fruit-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createTreeProduct, deleteTreeProduct, getTreeProducts } from '@/services/tree-product-service';
import { createTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';
import { isFormComplete, isNameTaken, makeInitialValues, parseAmount, type TreeStockFormValues } from './tree-stock-form';
import { TreeStockFormFields } from './tree-stock-form-fields';

type Props = {
  open: boolean;
  editingStock: TreeStock | null;
  /** The rows that already exist, so a name another row holds is caught before saving. */
  existingItems: TreeStock[];
  onClose: () => void;
  onSaved: (stock: TreeStock, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

/** Add or edit an orchard: what fruit it is, how many trees, and what those trees produce. */
export function TreeStockFormModal({ open, editingStock, existingItems, onClose, onSaved, onLimitReached }: Props) {
  const { t } = useLanguage();

  const [values, setValues] = useState<TreeStockFormValues>(() => makeInitialValues(editingStock));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setValues(makeInitialValues(editingStock));
    setFormError(null);
    loadAssignedProduce(editingStock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

  /**
   * The name of what an existing orchard produces, to show back beside its trees. Only its name is
   * wanted — the row already carries the id, and nothing here rewrites the product. A new orchard
   * has nothing to read, and neither has a row recorded before produce was asked for; both show a
   * dash instead.
   */
  async function loadAssignedProduce(stock: TreeStock | null) {
    if (stock?.treeProductId == null) return;
    try {
      const found = (await getTreeProducts()).find((product) => product.id === stock.treeProductId);
      if (found) setField('produce', found.name);
    } catch {
      // Couldn't read it: the field shows a dash, which changes nothing about what is saved.
    }
  }

  const setField = <K extends keyof TreeStockFormValues>(key: K, value: TreeStockFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const canSubmit = isFormComplete(values) && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (isNameTaken(values.name, existingItems, editingStock)) {
      setFormError(t('treeStock.nameDuplicate'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = values.name.trim();
      const produce = fruitTypeLabel(values.type, t);
      const amount = parseAmount(values.amount);

      if (isEditing) {
        // The produce isn't on offer here, so the row carries the product it already had straight
        // through — spread in with the rest of the orchard.
        const updated: TreeStock = { ...editingStock, type: values.type, name, amount, unit: values.unit };
        await updateTreeStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        // The product has to exist before the row can name it, so it is written first — and taken
        // back out again if the row is then refused, rather than left in the catalog with nothing
        // producing it.
        const product = await createTreeProduct({ name: produce, unit: TREE_PRODUCT_DEFAULT_UNIT });
        let created: TreeStock;
        try {
          created = await createTreeStock({
            type: values.type,
            name,
            amount,
            unit: values.unit,
            landPlotId: null,
            treeProductId: product.id,
          });
        } catch (err) {
          await deleteTreeProduct(product.id).catch(() => {});
          throw err;
        }
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      // The produce is this orchard's own, so the label is the only thing left that another row can
      // already hold — one added from another session, which this form couldn't have known about.
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('treeStock.nameDuplicate'));
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="tree-stock-form-modal">
      <h2 className="form-title">{isEditing ? t('treeStock.edit') : t('treeStock.add')}</h2>

      <TreeStockFormFields
        open={open}
        isEditing={isEditing}
        values={values}
        formError={formError}
        setField={setField}
      />

      {/* Every field an existing orchard shows is settled at this point, so there is nothing for a
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
