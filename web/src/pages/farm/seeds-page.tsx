import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { BoxIcon, ChevronRightIcon, LeafIcon } from '@/components/icons/misc-icons';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getSeeds } from '@/services/seed-service';
import type { Seed } from '@/types/seed';

/**
 * The seed the farm holds — a read-only list. Seed is not kept by hand: it is created with the
 * stock of the crop it grows (POST /api/stocks/with-seed), goes out of use when that stock is
 * removed, and its amount moves by being sown against a harvest. So there is nothing to add,
 * edit or delete here; a tile only leads to that seed's history.
 */
export function SeedsPage() {
  const { t } = useLanguage();

  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setSeeds(await getSeeds());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('seed.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('seed.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : seeds.length === 0 ? (
        <p className="empty-state">{t('seed.empty')}</p>
      ) : (
        <div className="entity-tile-grid">
          {seeds.map((seed) => {
            const cropLabel = stockTypeLabel(seed.type, t);
            const title = seedTitle(seed, t);
            const onHand = t('seed.onHand', { amount: seed.amount, unit: t(SEED_UNIT_LABEL_KEY[seed.unit]) });
            return (
              <div key={seed.id} className="entity-tile">
                <Link to={`/farm/seeds/${seed.id}`} className="entity-tile-media">
                  <img src={stockKindImage(seed.type)} alt="" className="entity-tile-icon" />
                </Link>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <BoxIcon width={16} height={16} />
                      <span>{onHand}</span>
                    </div>
                    {/* The crop only needs spelling out when a custom name replaced it above. */}
                    {seed.name.trim() && (
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{cropLabel}</span>
                      </div>
                    )}
                  </div>

                  <span className="entity-tile-divider" />

                  <Link to={`/farm/seeds/${seed.id}`} className="entity-tile-details">
                    {t('common.details')}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
