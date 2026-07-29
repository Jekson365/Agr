import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { TreeProductFormModal } from '@/components/farm/tree-stock/tree-product-form-modal';
import { TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { deleteTreeProduct, getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** The fruit-product catalog: what trees can yield, with everything harvested against each. */
export function TreeProductsPage() {
  const { t } = useLanguage();

  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [movements, setMovements] = useState<TreeProductMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<TreeProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, movementList] = await Promise.all([getTreeProducts(), getTreeProductMovements()]);
      setProducts(productList);
      setMovements(movementList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Current balance per product: the sum of its movements (harvested adds, manual can subtract).
  const balanceByProduct = new Map<number, number>();
  for (const m of movements) {
    balanceByProduct.set(m.treeProductId, (balanceByProduct.get(m.treeProductId) ?? 0) + m.delta);
  }

  function openAdd() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  function openEdit(product: TreeProduct) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function handleSaved(product: TreeProduct, isNew: boolean) {
    setProducts((prev) => (isNew ? [...prev, product] : prev.map((p) => (p.id === product.id ? product : p))));
  }

  async function confirmDeleteProduct() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteTreeProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      // The server refuses while a fruit tree still yields it, or a harvest still records it.
      setError(
        err instanceof ApiError && err.status === 409
          ? t('treeProduct.deleteInUse')
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <div>
      <Link to="/farm/fruits" className="back-link">
        ← {t('farm.fruits')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('treeProduct.title')}</h1>
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('treeProduct.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('treeProduct.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : products.length === 0 ? (
        <p className="empty-state">{t('treeProduct.empty')}</p>
      ) : (
        <div className="list-card-grid two-col">
          {products.map((product) => {
            const balance = balanceByProduct.get(product.id) ?? 0;
            const unitLabel = t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg');
            return (
              <div key={product.id} className="list-card">
                <Link to={`/farm/fruits/products/${product.id}`} className="list-card-body">
                  <span className="list-card-info">
                    <span className="list-card-title">{product.name}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {t('treeProduct.colBalance')}: {`${round2(balance)} ${unitLabel}`}
                    </span>
                  </span>
                </Link>
                <CardMenu onEdit={() => openEdit(product)} onDelete={() => setConfirmDelete({ id: product.id, name: product.name })} />
              </div>
            );
          })}
        </div>
      )}

      <TreeProductFormModal open={formOpen} editingProduct={editingProduct} onClose={() => setFormOpen(false)} onSaved={handleSaved} />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteProduct}
      />
    </div>
  );
}
