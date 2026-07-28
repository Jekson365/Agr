import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { fruitKindImage, TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestProduct, getTreeProducts, updateHarvestProduct } from '@/services/tree-product-service';
import type { HarvestProduct, TreeProduct } from '@/types/tree-product';

type Props = {
  open: boolean;
  harvestId: number;
  editingProduct: HarvestProduct | null;
  onClose: () => void;
  onSaved: (harvestProduct: HarvestProduct, isNew: boolean) => void;
};

/** Records how much of a tree's product this harvest actually yielded. */
export function HarvestProductFormModal({ open, harvestId, editingProduct, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingProduct != null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingProduct ? String(editingProduct.amount) : '');
    setFormError(null);
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingProduct]);

  async function loadProducts() {
    setLoading(true);
    try {
      const productList = await getTreeProducts();
      setProducts(productList);
      setSelectedId(editingProduct?.treeProductId ?? productList[0]?.id ?? null);
    } catch {
      setProducts([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  function labelFor(product: TreeProduct): string {
    return `${product.name} (${t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg')})`;
  }

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  const canSubmit = selected != null && amount > 0 && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: HarvestProduct = { ...editingProduct, treeProductId: selectedId, amount };
        await updateHarvestProduct(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestProduct({ harvestId, treeProductId: selectedId, amount });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('harvestProduct.edit') : t('harvestProduct.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('treeProduct.title')}</label>
          {loading ? (
            <span className="limit-hint">…</span>
          ) : products.length === 0 ? (
            <p className="limit-hint">{t('harvestProduct.noProducts')}</p>
          ) : (
            <div className="kind-row">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  className={selectedId === product.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(product.id)}
                >
                  <img src={fruitKindImage('')} className="kind-chip-icon" alt="" />
                  <span>{labelFor(product)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {products.length > 0 && (
          <div className="field">
            <label>{t('harvestProduct.amountHarvested')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && (
              <span className="limit-hint">{t(TREE_PRODUCT_UNIT_LABEL_KEY[selected.unit] ?? 'farm.unitKg')}</span>
            )}
          </div>
        )}

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {products.length > 0 && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? t('common.save') : t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
