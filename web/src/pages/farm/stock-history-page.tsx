import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/history-columns.css';
import '@/components/farm/record-list.css';
import { StockPhotoHistoryView } from '@/components/farm/stock/stock-photo-history-view';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { formatLocalizedIsoDateTime } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { deleteStockMovement, getStockMovements } from '@/services/stock-movement-service';
import { getStockItem } from '@/services/stock-service';
import type { Stock } from '@/types/stock';
import type { StockMovement, StockMovementSource } from '@/types/stock-movement';

const SOURCE_LABEL_KEY: Record<StockMovementSource, string> = {
  Manual: 'stockHistory.sourceManual',
  Harvest: 'stockHistory.sourceHarvest',
  Market: 'stockHistory.sourceMarket',
  Purchase: 'stockHistory.sourcePurchase',
};

export function StockHistoryPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const stockId = Number(idParam);

  const [stock, setStock] = useState<Stock | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StockMovement | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getStockItem(stockId), getStockMovements(stockId)]);
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
      await deleteStockMovement(confirmDelete.id);
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
  const unitLabel = stock ? t(STOCK_UNIT_LABEL_KEY[stock.unit]) : '';
  const title = stock ? stock.name.trim() || stockTypeLabel(stock.type, t) : t('stockHistory.title');

  return (
    <div>
      <Link to="/farm/stock" className="back-link">
        ← {t('farm.plantStock')}
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{title}</h1>
          {/* Removed stock is off the stock list, but its history is still reachable by link —
              say why it isn't there any more rather than leaving the page looking ordinary. */}
          {stock?.isDeleted && <span className="page-header-removed">{t('stockHistory.removed')}</span>}
        </div>
      </div>

      <div className="history-columns">
        <div className="history-column">
          <h2 className="history-column-title">{t('stockHistory.movementsTab')}</h2>

          {loading ? (
            <div className="state-box">…</div>
          ) : error ? (
            <div className="state-box">
              <span>{t('stockHistory.loadError')}</span>
              <button type="button" className="retry-button" onClick={load}>
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <>
              {stock && (
                <div className="record-summary">
                  <div>
                    <div className="record-summary-label">{t('stockHistory.current')}</div>
                    <div className="record-summary-value">
                      {stock.amount} {unitLabel}
                    </div>
                  </div>
                </div>
              )}

              {movements.length === 0 ? (
                <p className="empty-state">{t('stockHistory.empty')}</p>
              ) : (
                <div className="record-list">
                  {newestFirst.map((movement) => (
                    <div key={movement.id} className={movement.delta < 0 ? 'record-card record-card-down' : 'record-card record-card-up'}>
                      <div className="record-card-main">
                        <span className="record-card-date">{formatLocalizedIsoDateTime(movement.createdAt, language)}</span>
                        <p className="record-card-line">{t(SOURCE_LABEL_KEY[movement.source])}</p>
                      </div>
                      <span
                        className={
                          movement.delta < 0 ? 'record-card-value record-card-value-down' : 'record-card-value record-card-value-up'
                        }
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
        </div>

        <div className="history-column">
          <h2 className="history-column-title">{t('stockHistory.photosTab')}</h2>
          <StockPhotoHistoryView stockId={stockId} />
        </div>
      </div>

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
