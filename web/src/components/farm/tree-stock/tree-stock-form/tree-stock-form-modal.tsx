import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { Modal } from '@/components/ui/modal';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { getPickedTreeStockIds } from '@/services/harvest-tree-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { createTreeStock, getTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';
import { FRUIT_KIND_CATALOG } from './fruit-kind-catalog';
import { TreeProductField } from './tree-product-field';
import {
  isFormComplete,
  isNameTaken,
  makeInitialValues,
  parseAmount,
  productsOfOtherRows,
  type TreeStockFormValues,
} from './tree-stock-form';

type Props = {
  open: boolean;
  editingStock: TreeStock | null;
  /** The rows that already exist, so a name or a product another row holds is caught before
   *  saving — and, for the product, kept out of the picker in the first place. */
  existingItems: TreeStock[];
  onClose: () => void;
  onSaved: (stock: TreeStock, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

/** Add or edit an orchard: what fruit it is, how many trees, and which catalog product they yield. */
export function TreeStockFormModal({ open, editingStock, existingItems, onClose, onSaved, onLimitReached }: Props) {
  const { t } = useLanguage();

  const [values, setValues] = useState<TreeStockFormValues>(() => makeInitialValues(editingStock));
  const [products, setProducts] = useState<TreeProduct[]>([]);
  /** The products the other rows already yield — one orchard per product, so these aren't on offer. */
  const [takenProducts, setTakenProducts] = useState<Set<number>>(new Set());
  /**
   * The product this form added inline, if it added one. An orchard yields a single product, so the
   * + is spent once used: adding a second would write a catalog entry that nothing produces, since
   * only the selected one is ever assigned.
   */
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  /**
   * Whether a harvest already recorded this fruit as picked. What it yielded is booked against the
   * product these trees produce, so from then on the product is settled — moving it would carry
   * produce nobody harvested onto another product's ledger. Read when the form opens rather than
   * taken from the list behind it, since a harvest may have been recorded since that was loaded.
   */
  const [productLocked, setProductLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setValues(makeInitialValues(editingStock));
    setFormError(null);
    setCreatedProductId(null);
    setProductLocked(false);
    const taken = productsOfOtherRows(existingItems, editingStock);
    setTakenProducts(taken);
    loadProducts(editingStock?.treeProductId ?? null, taken);
    loadPickedState(editingStock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

  async function loadProducts(preset: number | null, taken: Set<number>) {
    try {
      const list = await getTreeProducts();
      setProducts(list);
      // A product is required, so default to the assigned one, else the first one still free.
      setProductId(preset ?? list.find((product) => !taken.has(product.id))?.id ?? null);
    } catch {
      setProducts([]);
      setProductId(preset);
    }
  }

  /**
   * Whether this fruit is already picked by a harvest. Only an existing row can be — a new one has
   * no history — and a failed read leaves the field open, since the server refuses the change
   * anyway if it turns out there is one.
   */
  async function loadPickedState(stock: TreeStock | null) {
    if (stock == null) return;
    try {
      const picked = await getPickedTreeStockIds();
      setProductLocked(picked.includes(stock.id));
    } catch {
      setProductLocked(false);
    }
  }

  const setField = <K extends keyof TreeStockFormValues>(key: K, value: TreeStockFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  function setProductId(productId: number | null) {
    setField('productId', productId);
  }

  // A product just added inline: keep it and select it, so it's assigned on save.
  function handleProductCreated(product: TreeProduct) {
    setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
    setProductId(product.id);
    setCreatedProductId(product.id);
  }

  const canSubmit = isFormComplete(values) && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    if (isNameTaken(values.name, existingItems, editingStock)) {
      setFormError(t('treeStock.nameDuplicate'));
      return;
    }

    // The picker leaves out products another row yields, so this only catches one that was taken
    // while the form sat open.
    if (values.productId != null && takenProducts.has(values.productId)) {
      setFormError(t('treeProduct.taken'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = values.name.trim();
      const amount = parseAmount(values.amount);

      if (isEditing) {
        const updated: TreeStock = {
          ...editingStock,
          type: values.type,
          name,
          amount,
          unit: values.unit,
          // A picked row keeps the product it came in with — the field only shows it back.
          treeProductId: productLocked ? editingStock.treeProductId : values.productId,
        };
        await updateTreeStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeStock({
          type: values.type,
          name,
          amount,
          unit: values.unit,
          landPlotId: null,
          treeProductId: values.productId,
        });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      // The server rejects a name or a product another row already holds (e.g. one added from
      // another session, which this form couldn't have known about).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(await conflictMessage());
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  /**
   * Which of the two rules the server refused on. Reads the rows back rather than guessing: a 409
   * means this form's picture of them was out of date, so the fresh list also re-hides a product
   * that was claimed meanwhile.
   */
  async function conflictMessage(): Promise<string> {
    // A harvest recorded while the form sat open settles what the row produces: put the assigned
    // product back and lock the field, as it would have been had the picking come first.
    if (editingStock != null && !productLocked) {
      try {
        const picked = await getPickedTreeStockIds();
        if (picked.includes(editingStock.id)) {
          setProductLocked(true);
          setProductId(editingStock.treeProductId);
          return t('treeProduct.harvestedFixed');
        }
      } catch {
        // Couldn't look: the two rules below are the other ways a save is refused.
      }
    }

    try {
      const rows = await getTreeStock();
      const taken = productsOfOtherRows(rows, editingStock);
      setTakenProducts(taken);
      if (values.productId != null && taken.has(values.productId)) {
        setProductId(null);
        return t('treeProduct.taken');
      }
    } catch {
      // Couldn't look: the name is the other way a save is refused, so say that.
    }
    return t('treeStock.nameDuplicate');
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
          <KindCatalogField
            open={open}
            catalog={FRUIT_KIND_CATALOG}
            value={values.type}
            onChange={(type) => setField('type', type)}
            preset={null}
            labelText={t('farm.type')}
            addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
          />
        )}

        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={values.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder={t('treeStock.namePlaceholder')}
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

        {/* Fruit is counted in trees, so the unit isn't a choice — just shown for confirmation. */}
        <div className="field">
          <label>{t('farm.unit')}</label>
          <span className="limit-hint">{t(TREE_STOCK_UNIT_LABEL_KEY[values.unit] ?? 'farm.unitPlant')}</span>
        </div>

        {/* A new orchard may add the product it yields, once — without that, a farm with nothing
            left to pick could not record its trees at all. An existing one only reassigns among
            the products already in the catalog, and once a harvest has picked it, not even that. */}
        <TreeProductField
          products={products}
          taken={takenProducts}
          value={values.productId}
          onChange={setProductId}
          onProductCreated={isEditing || createdProductId != null ? undefined : handleProductCreated}
          locked={productLocked}
        />

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
