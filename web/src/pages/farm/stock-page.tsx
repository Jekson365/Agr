import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import '@/components/farm/farm-crud.css';
import { PacketsModal } from '@/components/farm/packets-modal';
import { StockFormModal } from '@/components/farm/stock/stock-form/stock-form-modal';
import { StockSeedLink } from '@/components/farm/stock/stock-seed-link';
import { ChevronRightIcon, LeafIcon } from '@/components/icons/misc-icons';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { seedForStock } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getSeeds } from '@/services/seed-service';
import { getStock } from '@/services/stock-service';
import type { Seed } from '@/types/seed';
import type { Stock } from '@/types/stock';

export function StockPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [stock, setStock] = useState<Stock[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Stock | null>(null);
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [stockList, seedList] = await Promise.all([getStock(), getSeeds()]);
      setStock(stockList);
      setSeeds(seedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const atLimit = isAtLimit(user?.maxStockKinds, stock.length);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxStockKinds, stock.length);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.plantStock') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Stock) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.plantStock') }));
      return;
    }
    setEditingItem(item);
    setFormOpen(true);
  }

  /* The client checks above run on a possibly stale user/plan, so the server has the last word —
     when it answers 402 the packets go up just the same. */
  function handleLimitReached(message: string) {
    setFormOpen(false);
    setPacketsMessage(message);
  }

  function handleSaved(item: Stock, isNew: boolean, seed?: Seed) {
    setStock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
    if (seed) {
      setSeeds((prev) => [...prev, seed]);
    }
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.plantStock')}</h1>
        <div className="page-header-actions">
          {/* Enabled even at the cap — clicking it answers with the available packets. */}
          <button type="button" className="add-button" onClick={openAdd}>
            + {t('farm.addStock')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadErrorStock')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="entity-tile-grid">
          {stock.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            const seed = seedForStock(seeds, item);
            return (
              <div key={item.id} className="entity-tile">
                <Link to={`/farm/stock/${item.id}`} className="entity-tile-media">
                  <img src={stockKindImage(item.type)} alt="" className="entity-tile-icon" />
                </Link>

                {seed && <StockSeedLink seedId={seed.id} />}

                <div className="entity-tile-menu">
                  {/* Edit only: a good is no longer removed from its card. */}
                  <CardMenu onEdit={() => openEdit(item)} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  {/* The crop only needs spelling out when a custom name replaced it above. */}
                  {item.name.trim() && (
                    <div className="entity-tile-meta">
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{typeLabel}</span>
                      </div>
                    </div>
                  )}

                  <span className="entity-tile-divider" />

                  <Link to={`/farm/stock/${item.id}`} className="entity-tile-details">
                    {t('common.details')}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.plantStock') })}</p>}

      <StockFormModal
        open={formOpen}
        editingStock={editingItem}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onLimitReached={handleLimitReached}
      />

      <PacketsModal
        open={packetsMessage != null}
        message={packetsMessage ?? ''}
        onClose={() => setPacketsMessage(null)}
      />

    </div>
  );
}
