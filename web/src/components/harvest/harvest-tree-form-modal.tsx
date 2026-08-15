import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { fruitKindImage, fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createHarvestTree, updateHarvestTree } from '@/services/harvest-tree-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestTree } from '@/types/harvest-tree';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  harvestId: number;
  editingTree: HarvestTree | null;
  /** What this harvest already records as picked, so those orchards stay out of the picker. */
  existingTrees: HarvestTree[];
  onClose: () => void;
  onSaved: (harvestTree: HarvestTree, isNew: boolean) => void;
};

/** Records how many trees of an orchard were picked. The orchard's own count is untouched —
 * the fruit that came off them is recorded as a result, by weight, against plant stock. */
export function HarvestTreeFormModal({ open, harvestId, editingTree, existingTrees, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  /** The orchards still free to record — the farm's fruit, minus what this harvest already picked. */
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  /** Whether the farm holds any fruit at all — "none exist" and "all picked already" differ. */
  const [hadAnyTrees, setHadAnyTrees] = useState(false);
  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [harvestedInput, setHarvestedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingTree != null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingTree ? String(editingTree.amount) : '');
    setHarvestedInput(editingTree ? String(editingTree.harvestedAmount) : '');
    setFormError(null);
    loadTreeStocks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTree]);

  async function loadTreeStocks() {
    setLoading(true);
    try {
      // Removed orchards come back too, but only so an existing row that names one keeps naming it
      // (filtered below) — a picking can't be recorded against fruit that is out of use.
      const [list, productList] = await Promise.all([getTreeStock(true), getTreeProducts()]);
      setHadAnyTrees(list.some((stock) => !stock.isDeleted));
      setTreeProducts(productList);

      // An orchard is picked once per harvest, so the ones already recorded are off the list. The
      // row being edited doesn't count against itself — its own orchard has to stay pickable, even
      // once removed, since dropping it would silently repoint that row at another orchard.
      const picked = new Set(
        existingTrees.filter((tree) => tree.id !== editingTree?.id).map((tree) => tree.treeStockId)
      );
      const free = list.filter(
        (stock) => !picked.has(stock.id) && (!stock.isDeleted || stock.id === editingTree?.treeStockId)
      );

      setTreeStocks(free);
      setSelectedId(editingTree?.treeStockId ?? free[0]?.id ?? null);
    } catch {
      setTreeStocks([]);
      setTreeProducts([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  function labelFor(treeStock: TreeStock): string {
    const fruit = fruitTypeLabel(treeStock.type, t);
    return treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit;
  }

  const selected = treeStocks.find((s) => s.id === selectedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  const harvestedAmount = Math.max(0, parseFloat(harvestedInput) || 0);
  // The produce unit for the selected orchard's assigned product, shown next to the harvested field.
  const harvestedUnit = (() => {
    const product = selected != null ? treeProducts.find((p) => p.id === selected.treeProductId) : null;
    return product ? t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg') : '';
  })();
  // You can't pick more trees than the orchard holds, but picking doesn't consume them either.
  const overAvailable = selected != null && amount > selected.amount;
  const canSubmit = selected != null && amount > 0 && !overAvailable && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: HarvestTree = { ...editingTree, treeStockId: selectedId, amount, harvestedAmount };
        await updateHarvestTree(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestTree({ harvestId, treeStockId: selectedId, amount, harvestedAmount });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server refuses an orchard this harvest picked meanwhile (e.g. from another session).
      setFormError(
        err instanceof ApiError && err.status === 409 ? t('harvestTree.alreadyPicked') : t('farm.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('harvestTree.edit') : t('harvestTree.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.fruits')}</label>
          {loading ? (
            <span className="limit-hint">…</span>
          ) : treeStocks.length === 0 ? (
            <p className="limit-hint">{t(hadAnyTrees ? 'harvestTree.allPicked' : 'harvestTree.noTrees')}</p>
          ) : (
            <div className="kind-row">
              {treeStocks.map((treeStock) => (
                <button
                  key={treeStock.id}
                  type="button"
                  className={selectedId === treeStock.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(treeStock.id)}
                >
                  <img src={fruitKindImage(treeStock.type)} className="kind-chip-icon" alt="" />
                  <span>{labelFor(treeStock)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {treeStocks.length > 0 && (
          <div className="field">
            <label>{t('harvestTree.amountPicked')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && (
              <span className={overAvailable ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {t('harvestTree.available', {
                  amount: selected.amount,
                  unit: t(TREE_STOCK_UNIT_LABEL_KEY[selected.unit] ?? 'farm.unitPlant'),
                })}
              </span>
            )}
          </div>
        )}

        {treeStocks.length > 0 && (
          <div className="field">
            <label>{t('harvestTree.amountHarvested')}</label>
            <input
              value={harvestedInput}
              onChange={(e) => setHarvestedInput(e.target.value)}
              placeholder="0"
              inputMode="decimal"
            />
            {harvestedUnit && <span className="limit-hint">{harvestedUnit}</span>}
          </div>
        )}

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {treeStocks.length > 0 && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? t('common.save') : t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
