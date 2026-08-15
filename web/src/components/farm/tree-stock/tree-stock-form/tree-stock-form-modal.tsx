import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { Modal } from '@/components/ui/modal';
import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_DEFAULT_UNIT,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createTreeProduct, deleteTreeProduct, getTreeProducts } from '@/services/tree-product-service';
import { createTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';
import { FRUIT_KIND_CATALOG } from './fruit-kind-catalog';
import { isFormComplete, isNameTaken, makeInitialValues, parseAmount, type TreeStockFormValues } from './tree-stock-form';

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

  const canSubmit = isFormComplete(values, isEditing) && !saving;

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
      const produce = values.produce.trim();
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
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('treeStock.edit') : t('treeStock.add')}</h2>

      <div className="form-fields">
        {/* The fruit is what the orchard's product and its picked-tree history hang off, so it is
            settled when the row is created — an existing one shows its kind rather than offering
            to move the orchard to another fruit. */}
        {isEditing ? (
          <div className="field">
            <label>{t('farm.type')}</label>
            <span className="limit-hint field-fixed-value">
              <img src={fruitKindImage(values.type)} className="kind-chip-icon" alt="" />
              {fruitTypeLabel(values.type, t)}
            </span>
          </div>
        ) : (
          /* A dropdown rather than the chip row, as on the stock and livestock forms: one field
             tall with a search box, so the fruit catalog can grow without pushing the fields
             below it off the modal. */
          <KindCatalogField
            open={open}
            catalog={FRUIT_KIND_CATALOG}
            value={values.type}
            onChange={(type) => setField('type', type)}
            preset={null}
            labelText={t('farm.type')}
            addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
            variant="dropdown"
            /* Adding a fruit from here is switched off — the catalog is settled, and a fruit
               invented mid-form lands as a near-duplicate of one already in it. Flip to true to
               bring back both the "New type" button and the add row under a fruitless search. */
            allowAdd={false}
          />
        )}

        {/* The label is how this orchard is named everywhere it appears — its plot, its history,
            the harvests that picked it — so it is settled with the row rather than moved under
            them afterwards. */}
        <div className="field">
          <label>{t('farm.name')}</label>
          {isEditing ? (
            <span className="limit-hint field-fixed-value">{values.name.trim() || '—'}</span>
          ) : (
            <input
              value={values.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder={t('treeStock.namePlaceholder')}
            />
          )}
        </div>

        {/* How many trees stand today is the sum of the movements logged against the orchard, so it
            is recorded on its history page rather than typed over here — an edit straight to the
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

        {/* Fruit is counted in trees, so the unit isn't a choice — just shown for confirmation. */}
        <div className="field">
          <label>{t('farm.unit')}</label>
          <span className="limit-hint">{t(TREE_STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitPlant')}</span>
        </div>

        {/* Typed, not picked: an orchard's produce is its own, so every entry already in the
            catalog belongs to another orchard and offering them would only list choices that
            can't be taken. Named once, with the row — what it yielded is booked against that
            product from the first harvest on, so an existing orchard shows it back rather than
            offering to rewrite it. */}
        <div className="field">
          <label>{t('treeProduct.producesLabel')}</label>
          {isEditing ? (
            <span className="limit-hint field-fixed-value">{values.produce || '—'}</span>
          ) : (
            <input
              value={values.produce}
              onChange={(e) => setField('produce', e.target.value)}
              placeholder={t('treeProduct.producesPlaceholder')}
            />
          )}
        </div>

        {formError && <div className="error-banner">{formError}</div>}
      </div>

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
