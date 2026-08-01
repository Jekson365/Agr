import { useState } from 'react';

import { TreeProductFormModal } from '@/components/farm/tree-stock/tree-product-form-modal';
import { TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { TreeProduct } from '@/types/tree-product';

type Props = {
  /** Every product in the catalog, including the ones already spoken for. */
  products: TreeProduct[];
  /** The products other rows already yield, kept out of the picker. */
  taken: Set<number>;
  value: number | null;
  onChange: (productId: number) => void;
  /**
   * A product added inline, so the caller can keep it in its own list. Omitted where the catalog
   * is not the orchard's to add to — which is what hides the + — see the form.
   */
  onProductCreated?: (product: TreeProduct) => void;
  /** Settled by a harvest that already recorded this fruit as picked: shown back, not offered. */
  locked?: boolean;
};

/**
 * Which catalog product these trees yield — required, and one product to an orchard, so the ones
 * other fruit already yield aren't offered. Products are managed on the Products tab; a new one
 * can be added inline with the +, which matters when there is nothing left to pick.
 */
export function TreeProductField({ products, taken, value, onChange, onProductCreated, locked }: Props) {
  const { t } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);

  const free = products.filter((product) => !taken.has(product.id));
  const canAdd = onProductCreated != null;

  const productLabel = (product: TreeProduct) =>
    `${product.name} (${t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg')})`;

  // Harvested produce is booked against this product, so there is nothing to choose any more —
  // the assigned one is shown back, with why it can't move.
  if (locked) {
    const assigned = products.find((product) => product.id === value);
    return (
      <div className="field">
        <label>{t('treeProduct.producesLabel')}</label>
        <span className="limit-hint field-fixed-value">{assigned ? productLabel(assigned) : '—'}</span>
        <span className="limit-hint">{t('treeProduct.harvestedFixed')}</span>
      </div>
    );
  }

  return (
    <div className="field">
      <label>{t('treeProduct.producesLabel')}</label>
      <div className="kind-row">
        {free.map((product) => (
          <button
            key={product.id}
            type="button"
            className={value === product.id ? 'kind-chip active' : 'kind-chip'}
            onClick={() => onChange(product.id)}
          >
            <span>{productLabel(product)}</span>
          </button>
        ))}
        {canAdd && (
          <button type="button" className="kind-chip-add" onClick={() => setAddOpen(true)} aria-label={t('treeProduct.add')}>
            +
          </button>
        )}
      </div>
      {free.length === 0 && (
        <span className="limit-hint">
          {t(products.length === 0 ? 'treeProduct.requiredHint' : canAdd ? 'treeProduct.allTaken' : 'treeProduct.allTakenFixed')}
        </span>
      )}

      {onProductCreated && (
        <TreeProductFormModal
          open={addOpen}
          editingProduct={null}
          onClose={() => setAddOpen(false)}
          onSaved={onProductCreated}
        />
      )}
    </div>
  );
}
