import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AssessmentCriteriaCard } from '@/components/farm/assessment/assessment-criteria-card';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/record-list.css';
import { TreeMovementList } from '@/components/farm/tree-stock/tree-movement-list';
import { TreePlantingModal } from '@/components/farm/tree-stock/tree-planting-modal';
import { TreeStockActions } from '@/components/farm/tree-stock/tree-stock-actions';
import { fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { deleteTreeStockMovement, getTreeStockMovements } from '@/services/tree-stock-movement-service';
import { getTreeStockItem } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';
import type { TreeStockMovement } from '@/types/tree-stock-movement';
import './tree-stock-history.css';

export function TreeStockHistoryPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const treeStockId = Number(idParam);

  const [stock, setStock] = useState<TreeStock | null>(null);
  const [movements, setMovements] = useState<TreeStockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<TreeStockMovement | null>(null);
  const [planting, setPlanting] = useState<'plant' | 'remove' | null>(null);

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

  const unitLabel = stock ? t(TREE_STOCK_UNIT_LABEL_KEY[stock.unit]) : '';
  const title = stock ? stock.name.trim() || fruitTypeLabel(stock.type, t) : t('treeStockHistory.title');

  return (
    <div>
      <Link to="/farm/fruits" className="back-link">
        ← {t('farm.fruits')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{title}</h1>
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
            <div className="record-summary tsh-summary">
              <div>
                <div className="record-summary-label">{t('treeStockHistory.current')}</div>
                <div className="record-summary-value">
                  {stock.amount} {unitLabel}
                </div>
              </div>

              {!stock.isDeleted && (
                <TreeStockActions onPlant={() => setPlanting('plant')} onRemove={() => setPlanting('remove')} />
              )}
            </div>
          )}

          {movements.length === 0 ? (
            <p className="empty-state">{t('treeStockHistory.empty')}</p>
          ) : (
            <TreeMovementList
              movements={movements}
              amount={stock?.amount ?? 0}
              unitLabel={unitLabel}
              onDelete={setConfirmDelete}
            />
          )}
        </>
      )}

      {/* The orchard's grading standard, on the same footing as a plant-stock good's. */}
      <AssessmentCriteriaCard treeStockId={treeStockId} canEdit={!stock?.isDeleted} />

      <TreePlantingModal
        open={planting != null}
        treeStockId={treeStockId}
        direction={planting ?? 'plant'}
        available={stock?.amount ?? 0}
        unitLabel={unitLabel}
        onClose={() => setPlanting(null)}
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
