import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { TreeProductFormModal } from '@/components/farm/tree-stock/tree-product-form-modal';
import { Modal } from '@/components/ui/modal';
import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_DEFAULT_UNIT,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createFruitKind, deleteFruitKind, getFruitKinds } from '@/services/fruit-kind-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { createTreeStock, getTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { FruitKind } from '@/types/fruit-kind';
import type { TreeProduct } from '@/types/tree-product';
import type { FruitType, TreeStock, TreeStockUnit } from '@/types/tree-stock';

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

export function TreeStockFormModal({
  open,
  editingStock,
  existingItems,
  onClose,
  onSaved,
  onLimitReached,
}: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<FruitKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [kindError, setKindError] = useState<string | null>(null);
  const [confirmDeleteKind, setConfirmDeleteKind] = useState<{ id: number; label: string } | null>(null);
  const [fruitType, setFruitType] = useState<FruitType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  // Always trees for a new entry; an older row keeps whatever it was created under.
  const [unit, setUnit] = useState<TreeStockUnit>(TREE_STOCK_DEFAULT_UNIT);

  // Which catalog product these trees yield. Managed on the Products tab; a new one can be added
  // inline here without leaving the form.
  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  /** The products the other rows already yield — one orchard per product, so these aren't on offer. */
  const [takenProducts, setTakenProducts] = useState<Set<number>>(new Set());

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  useEffect(() => {
    if (!open) return;
    setFruitType(editingStock?.type ?? '');
    setNameInput(editingStock?.name ?? '');
    setAmountInput(editingStock ? String(editingStock.amount) : '');
    setUnit(editingStock?.unit ?? TREE_STOCK_DEFAULT_UNIT);
    setFormError(null);
    setKindError(null);
    const taken = productsOfOtherRows(existingItems, editingStock);
    setTakenProducts(taken);
    loadKinds(editingStock?.type ?? null);
    loadProducts(editingStock?.treeProductId ?? null, taken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingStock]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getFruitKinds();
      setKinds(list);
      if (!preset) {
        setFruitType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

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

  async function handleAddKind(name: string): Promise<KindOption | null> {
    setKindError(null);

    // A name is a duplicate if it matches an existing kind's raw name OR its localized label —
    // built-in kinds are stored under English keys ("Apple") but displayed translated ("ვაშლი"),
    // and either spelling would show up as a second identical entry in the picker.
    const candidate = name.trim().toLowerCase();
    const isDuplicate = kinds.some((k) => {
      const label = fruitTypeLabel(k.name, t);
      return k.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setKindError(t('farm.typeDuplicate'));
      return null;
    }

    try {
      const created = await createFruitKind({ name });
      setKinds((prev) => (prev.some((k) => k.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: fruitTypeLabel(created.name, t) };
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
      await deleteFruitKind(id);
      const deleted = kinds.find((k) => k.id === id);
      const next = kinds.filter((k) => k.id !== id);
      setKinds(next);
      // Don't leave the form pointing at a kind that no longer exists.
      if (deleted && deleted.name === fruitType) {
        setFruitType(next[0]?.name ?? '');
      }
    } catch (err) {
      // The server refuses to delete a kind that existing tree stock still references.
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeInUse') : t('farm.typeDeleteError'));
    } finally {
      setConfirmDeleteKind(null);
    }
  }

  // A product just added inline: keep it and select it, so it's assigned on save.
  function handleProductCreated(product: TreeProduct) {
    setProducts((prev) => (prev.some((p) => p.id === product.id) ? prev : [...prev, product]));
    setProductId(product.id);
  }

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  // Trees must declare what they produce, so a product is required to save.
  const canSubmit = fruitType.trim() !== '' && productId != null && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    const trimmedName = nameInput.trim();
    // The label is what tells two stocks of the same fruit apart, so it can't be shared. A blank
    // one isn't a label — those rows show their fruit's name instead, and any number may exist.
    const nameTaken =
      trimmedName !== '' &&
      existingItems.some(
        (item) => item.id !== editingStock?.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    if (nameTaken) {
      setFormError(t('treeStock.nameDuplicate'));
      return;
    }

    // The picker leaves out products another row yields, so this only catches one that was taken
    // while the form sat open.
    if (productId != null && takenProducts.has(productId)) {
      setFormError(t('treeProduct.taken'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = trimmedName;
      if (isEditing) {
        const updated: TreeStock = { ...editingStock, type: fruitType, name, amount, unit, treeProductId: productId };
        await updateTreeStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeStock({ type: fruitType, name, amount, unit, landPlotId: null, treeProductId: productId });
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
    try {
      const rows = await getTreeStock();
      const taken = productsOfOtherRows(rows, editingStock);
      setTakenProducts(taken);
      if (productId != null && taken.has(productId)) {
        setProductId(null);
        return t('treeProduct.taken');
      }
    } catch {
      // Couldn't look: the name is the other way a save is refused, so say that.
    }
    return t('treeStock.nameDuplicate');
  }

  function productLabel(product: TreeProduct): string {
    return `${product.name} (${t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg')})`;
  }

  const freeProducts = products.filter((product) => !takenProducts.has(product.id));

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('treeStock.edit') : t('treeStock.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.type')}</label>
          <KindPicker
            options={kinds.map((k) => ({ value: k.name, label: fruitTypeLabel(k.name, t), icon: fruitKindImage(k.name) }))}
            selected={fruitType}
            onSelect={setFruitType}
            onAddNew={handleAddKind}
            addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
            loading={kindsLoading}
            onRemove={(value) => {
              const kind = kinds.find((k) => k.name === value);
              if (kind) setConfirmDeleteKind({ id: kind.id, label: fruitTypeLabel(kind.name, t) });
            }}
            removeLabel={t('common.delete')}
          />
          {kindError && <div className="error-banner">{kindError}</div>}
        </div>

        <div className="field">
          <label>{t('farm.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('treeStock.namePlaceholder')} />
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

        {/* Fruit is counted in trees, so the unit isn't a choice — just shown for confirmation. */}
        <div className="field">
          <label>{t('farm.unit')}</label>
          <span className="limit-hint">{t(TREE_STOCK_UNIT_LABEL_KEY[unit] ?? 'farm.unitPlant')}</span>
        </div>

        {/* Which catalog product these trees yield — required, and one product to an orchard, so
            the ones other fruit already yield aren't offered. Managed on the Products tab; a new
            one can be added inline with the + when there's nothing left to pick. */}
        <div className="field">
          <label>{t('treeProduct.producesLabel')}</label>
          <div className="kind-row">
            {freeProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className={productId === product.id ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setProductId(product.id)}
              >
                <span>{productLabel(product)}</span>
              </button>
            ))}
            <button type="button" className="kind-chip-add" onClick={() => setProductModalOpen(true)} aria-label={t('treeProduct.add')}>
              +
            </button>
          </div>
          {freeProducts.length === 0 && (
            <span className="limit-hint">
              {t(products.length === 0 ? 'treeProduct.requiredHint' : 'treeProduct.allTaken')}
            </span>
          )}
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

      <TreeProductFormModal
        open={productModalOpen}
        editingProduct={null}
        onClose={() => setProductModalOpen(false)}
        onSaved={(product) => handleProductCreated(product)}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteKind}
        name={confirmDeleteKind?.label ?? ''}
        onCancel={() => setConfirmDeleteKind(null)}
        onConfirm={confirmDeleteKindNow}
      />
    </Modal>
  );
}

/** The products already spoken for by rows other than the one being edited. */
function productsOfOtherRows(rows: TreeStock[], editing: TreeStock | null): Set<number> {
  const ids = rows
    .filter((row) => row.id !== editing?.id && row.treeProductId != null)
    .map((row) => row.treeProductId as number);
  return new Set(ids);
}
