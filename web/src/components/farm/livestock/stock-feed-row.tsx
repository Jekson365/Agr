import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createStockFeed, deleteStockFeed, getStockFeeds, updateStockFeed } from '@/services/stock-feed-service';
import { getStock } from '@/services/stock-service';
import type { Stock } from '@/types/stock';
import type { StockFeed } from '@/types/stock-feed';
import './stock-feed-row.css';

type Props = {
  /** Feed is tracked per livestock group. */
  livestockId: number;
};

/** Icons for what a livestock group is fed; clicking one lets you edit its amount.
 * Mirrors the mobile StockFeedRow. */
export function StockFeedRow({ livestockId }: Props) {
  const { t } = useLanguage();

  const [feeds, setFeeds] = useState<StockFeed[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingFeed, setEditingFeed] = useState<StockFeed | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [feedList, stockList] = await Promise.all([getStockFeeds(livestockId), getStock()]);
      setFeeds(feedList);
      setStocks(stockList);
    } catch {
      setError(t('feed.loadError'));
    } finally {
      setLoading(false);
    }
  }

  function stockFor(feed: StockFeed): Stock | undefined {
    return stocks.find((s) => s.id === feed.stockId);
  }

  function openEdit(feed: StockFeed) {
    setEditingFeed(feed);
    setAmountInput(String(feed.amount));
  }

  function openAdd() {
    setSelectedStockId(stocks[0]?.id ?? null);
    setAmountInput('');
    setAddOpen(true);
  }

  const amount = parseFloat(amountInput);
  const amountValid = amount > 0;

  async function handleSaveEdit() {
    if (!editingFeed || !amountValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated: StockFeed = { ...editingFeed, amount };
      await updateStockFeed(updated.id, updated);
      setFeeds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFeed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingFeed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await deleteStockFeed(editingFeed.id);
      setFeeds((prev) => prev.filter((f) => f.id !== editingFeed.id));
      setEditingFeed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (selectedStockId == null || !amountValid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createStockFeed({ livestockId, stockId: selectedStockId, amount });
      setFeeds((prev) => [...prev, created]);
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="feed-row feed-loading">…</div>;
  }

  const editingStock = editingFeed ? stockFor(editingFeed) : undefined;

  return (
    <>
      <div className="feed-row">
        {feeds.map((feed) => {
          const stock = stockFor(feed);
          return (
            <button
              key={feed.id}
              type="button"
              className="feed-item"
              onClick={() => openEdit(feed)}
              title={stock ? stockTypeLabel(stock.type, t) : t('feed.editTitle')}
            >
              <span className="feed-icon-wrap">
                {stock ? <img src={stockKindImage(stock.type)} alt="" /> : <span>?</span>}
              </span>
              <span className="feed-amount">
                {feed.amount} {stock ? t(STOCK_UNIT_LABEL_KEY[stock.unit]) : ''}
              </span>
            </button>
          );
        })}

        <button type="button" className="feed-item feed-add" onClick={openAdd} aria-label={t('feed.addTitle')}>
          <span className="feed-icon-wrap">+</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Edit an existing feed's amount */}
      <Modal open={!!editingFeed} onClose={() => setEditingFeed(null)}>
        <h2 className="form-title">
          {t('feed.editTitle')}
          {editingStock ? ` — ${stockTypeLabel(editingStock.type, t)}` : ''}
        </h2>

        <div className="form-fields">
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
          <button type="button" className="btn btn-secondary feed-delete" onClick={handleDelete} disabled={saving}>
            {t('common.delete')}
          </button>
          <button type="button" className="btn" onClick={handleSaveEdit} disabled={saving || !amountValid}>
            {t('common.save')}
          </button>
        </div>
      </Modal>

      {/* Add a new feed entry */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)}>
        <h2 className="form-title">{t('feed.addTitle')}</h2>

        {stocks.length === 0 ? (
          <p className="limit-hint">{t('feed.noStock')}</p>
        ) : (
          <div className="form-fields">
            <div className="field">
              <label>{t('feed.selectStock')}</label>
              <div className="kind-row">
                {stocks.map((stock) => (
                  <button
                    key={stock.id}
                    type="button"
                    className={selectedStockId === stock.id ? 'kind-chip active' : 'kind-chip'}
                    onClick={() => setSelectedStockId(stock.id)}
                  >
                    <img src={stockKindImage(stock.type)} className="kind-chip-icon" alt="" />
                    <span>{stock.name.trim() || stockTypeLabel(stock.type, t)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>{t('farm.amount')}</label>
              <input
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder={t('farm.amountPlaceholder')}
                inputMode="decimal"
              />
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
            {t('common.cancel')}
          </button>
          {stocks.length > 0 && (
            <button type="button" className="btn" onClick={handleAdd} disabled={saving || !amountValid || selectedStockId == null}>
              {t('common.add')}
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
