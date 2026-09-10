import { useEffect, useState } from 'react';

import { EMPTY_FEED_CATALOG, feedTargetOf, type FeedCatalog } from '@/config/feed-source';
import { useLanguage } from '@/contexts/language-context';
import { getEquipment } from '@/services/equipment-service';
import { getStockFeeds } from '@/services/stock-feed-service';
import { getStock } from '@/services/stock-service';
import { getTreeProducts } from '@/services/tree-product-service';
import type { StockFeed } from '@/types/stock-feed';
import { FeedAddModal } from './feed-add-modal';
import { FeedEditModal } from './feed-edit-modal';
import './stock-feed-row.css';

type Props = {
  /** Feed is tracked per livestock group. */
  livestockId: number;
};

/** Icons for what a livestock group is fed; clicking one lets you edit its amount. A feeding may
 * name a plant stock, a fruit product or a piece of inventory — whichever the farm keeps it as. */
export function StockFeedRow({ livestockId }: Props) {
  const { t } = useLanguage();

  const [feeds, setFeeds] = useState<StockFeed[]>([]);
  const [catalog, setCatalog] = useState<FeedCatalog>(EMPTY_FEED_CATALOG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<StockFeed | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [feedList, stocks, products, equipment] = await Promise.all([
        getStockFeeds(livestockId),
        getStock(),
        getTreeProducts().catch(() => []),
        getEquipment().catch(() => []),
      ]);
      setFeeds(feedList);
      setCatalog({ stocks, products, equipment });
    } catch {
      setError(t('feed.loadError'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="feed-row feed-loading">…</div>;
  }

  return (
    <>
      <div className="feed-row">
        {feeds.map((feed) => {
          const target = feedTargetOf(feed, catalog, t);
          return (
            <button
              key={feed.id}
              type="button"
              className="feed-item"
              onClick={() => setEditing(feed)}
              title={target?.label ?? t('feed.editTitle')}
            >
              <span className="feed-icon-wrap">
                {target ? <img src={target.icon} alt="" /> : <span>?</span>}
              </span>
              <span className="feed-amount">
                {feed.amount} {target?.unitLabel ?? ''}
              </span>
            </button>
          );
        })}

        <button type="button" className="feed-item feed-add" onClick={() => setAddOpen(true)} aria-label={t('feed.addTitle')}>
          <span className="feed-icon-wrap">+</span>
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <FeedEditModal
        feed={editing}
        catalog={catalog}
        onClose={() => setEditing(null)}
        onSaved={(saved) => setFeeds((prev) => prev.map((row) => (row.id === saved.id ? saved : row)))}
        onDeleted={(id) => setFeeds((prev) => prev.filter((row) => row.id !== id))}
      />

      <FeedAddModal
        open={addOpen}
        livestockId={livestockId}
        catalog={catalog}
        onClose={() => setAddOpen(false)}
        onAdded={(created) => setFeeds((prev) => [...prev, created])}
      />
    </>
  );
}
