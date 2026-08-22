import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AdjustBalanceModal } from '@/components/farm/adjust-balance-modal';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/record-list.css';
import { fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { formatLocalizedIsoDateTime, formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { deleteTreeStockMovement, getTreeStockMovements } from '@/services/tree-stock-movement-service';
import { getTreeStockItem } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';
import type { BalanceAdjustOption } from '@/types/balance-adjustment';
import type { TreeStockMovement } from '@/types/tree-stock-movement';

export function TreeStockHistoryPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const treeStockId = Number(idParam);

  const [stock, setStock] = useState<TreeStock | null>(null);
  const [movements, setMovements] = useState<TreeStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TreeStockMovement | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);

  useEffect(() => {
    if (!treeStockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeStockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getTreeStockItem(treeStockId), getTreeStockMovements(treeStockId)]);
      setStock(item);
      setMovements(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteMovement() {
    if (!confirmDelete) return;
    try {
      await deleteTreeStockMovement(confirmDelete.id);
      // The server also reversed the movement's effect on the amount — reload both.
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  // Records come back ordered oldest→newest; show the most recent movement first.
  const newestFirst = [...movements].reverse();
  const unitLabel = stock ? t(TREE_STOCK_UNIT_LABEL_KEY[stock.unit]) : '';
  const title = stock ? stock.name.trim() || fruitTypeLabel(stock.type, t) : t('treeStockHistory.title');

  const adjustOptions: BalanceAdjustOption[] =
    stock && !stock.isDeleted
      ? [{ key: `tree:${stock.id}`, title, unitLabel, balance: stock.amount, target: { kind: 'treeStock', treeStockId: stock.id } }]
      : [];

  return (
    <div>
      <Link to="/farm/fruits" className="back-link">
        ← {t('farm.fruits')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        {adjustOptions.length > 0 && (
          <button type="button" className="add-button" onClick={() => setAdjustOpen(true)}>
            + {t('treeStockHistory.adjust')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('treeStockHistory.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          {stock && (
            <div className="record-summary">
              <div>
                <div className="record-summary-label">{t('treeStockHistory.current')}</div>
                <div className="record-summary-value">
                  {stock.amount} {unitLabel}
                </div>
              </div>
            </div>
          )}

          {movements.length === 0 ? (
            <p className="empty-state">{t('treeStockHistory.empty')}</p>
          ) : (
            <div className="record-list">
              {newestFirst.map((movement) => (
                <div key={movement.id} className={movement.delta < 0 ? 'record-card record-card-down' : 'record-card record-card-up'}>
                  <div className="record-card-main">
                    <span className="record-card-date">
                      {movement.date
                        ? formatLocalizedIsoDay(movement.date, language)
                        : formatLocalizedIsoDateTime(movement.createdAt, language)}
                    </span>
                    {movement.note && <span className="record-card-note">{movement.note}</span>}
                  </div>
                  <span
                    className={movement.delta < 0 ? 'record-card-value record-card-value-down' : 'record-card-value record-card-value-up'}
                  >
                    {movement.delta >= 0 ? '+' : ''}
                    {movement.delta} {unitLabel}
                  </span>
                  {movement.source !== 'Harvest' && (
                    <button
                      type="button"
                      className="record-card-delete"
                      onClick={() => setConfirmDelete(movement)}
                      aria-label={t('common.delete')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <AdjustBalanceModal
        open={adjustOpen}
        options={adjustOptions}
        onClose={() => setAdjustOpen(false)}
        onSaved={load}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete ? `${confirmDelete.delta >= 0 ? '+' : ''}${confirmDelete.delta} ${unitLabel}` : ''}
        body={t('stockHistory.deleteBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteMovement}
      />
    </div>
  );
}
