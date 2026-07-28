import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/record-list.css';
import { Modal } from '@/components/ui/modal';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import {
  createTreeProductMovement,
  getTreeProductMovements,
  getTreeProducts,
} from '@/services/tree-product-service';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A product's ledger: what each harvest added, plus manual adjustments, and a form to add one. */
export function TreeProductHistoryPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const productId = Number(idParam);

  const [product, setProduct] = useState<TreeProduct | null>(null);
  const [movements, setMovements] = useState<TreeProductMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [direction, setDirection] = useState<'add' | 'remove'>('remove');
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, movementList] = await Promise.all([getTreeProducts(), getTreeProductMovements(productId)]);
      setProduct(productList.find((p) => p.id === productId) ?? null);
      setMovements(movementList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const unitLabel = product ? t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg') : '';
  const balance = round2(movements.reduce((sum, m) => sum + m.delta, 0));

  const amount = parseFloat(amountInput) || 0;
  const canSave = amount > 0 && !saving;

  function openAdjust() {
    setDirection('remove');
    setAmountInput('');
    setFormOpen(true);
  }

  async function saveAdjust() {
    if (!canSave) return;
    setSaving(true);
    try {
      const delta = direction === 'add' ? amount : -amount;
      const created = await createTreeProductMovement(productId, delta);
      setMovements((prev) => [created, ...prev]);
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link to="/farm/fruits/products" className="back-link">
        ← {t('treeProduct.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{product?.name ?? t('treeProduct.title')}</h1>
        <button type="button" className="add-button" onClick={openAdjust} disabled={!product}>
          + {t('treeProduct.adjust')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error || !product ? (
        <div className="state-box">
          <span>{t('treeProduct.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="list-card-grid">
            <div className="list-card">
              <div className="list-card-body">
                <span className="list-card-info">
                  <span className="list-card-title">
                    {t('treeProduct.colBalance')}: {balance} {unitLabel}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {movements.length === 0 ? (
            <p className="empty-state">{t('treeProduct.noHistory')}</p>
          ) : (
            <div className="production-table-wrap">
              <div className="seed-history-table">
                <div className="production-row production-row-head">
                  <span>{t('history.date')}</span>
                  <span>{t('seed.movementSource')}</span>
                  <span className="num">{t('farm.amount')}</span>
                </div>
                {movements.map((movement) => (
                  <div key={movement.id} className="production-row">
                    <span className="production-row-cell muted">{formatLocalizedIsoDate(movement.createdAt, language)}</span>
                    <span className="production-row-cell">
                      {t(
                        movement.source === 'Harvest'
                          ? 'treeProduct.sourceHarvest'
                          : movement.source === 'Market'
                            ? 'treeProduct.sourceMarket'
                            : 'seed.sourceManual'
                      )}
                    </span>
                    <span className={`production-row-cell num strong ${movement.delta < 0 ? 'sale-delta' : 'income-delta'}`}>
                      {movement.delta > 0 ? '+' : ''}
                      {round2(movement.delta)} <span className="production-row-unit">{unitLabel}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <h2 className="form-title">{t('treeProduct.adjust')}</h2>
        <div className="form-fields">
          <div className="field">
            <label>{t('treeProduct.direction')}</label>
            <div className="kind-row">
              <button
                type="button"
                className={direction === 'remove' ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setDirection('remove')}
              >
                <span>{t('treeProduct.remove')}</span>
              </button>
              <button
                type="button"
                className={direction === 'add' ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setDirection('add')}
              >
                <span>{t('treeProduct.addStock')}</span>
              </button>
            </div>
          </div>

          <div className="field">
            <label>{t('farm.amount')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
              autoFocus
            />
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" onClick={saveAdjust} disabled={!canSave}>
            {t('common.save')}
          </button>
        </div>
      </Modal>
    </div>
  );
}
