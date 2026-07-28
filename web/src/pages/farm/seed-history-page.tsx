import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/record-list.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getSeed, getSeedMovements } from '@/services/seed-service';
import type { Seed } from '@/types/seed';
import type { SeedMovement } from '@/types/seed-movement';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A seed's ledger: the opening amount, manual corrections, and what each harvest sowed. */
export function SeedHistoryPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const seedId = Number(idParam);

  const [seed, setSeed] = useState<Seed | null>(null);
  const [movements, setMovements] = useState<SeedMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seedId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [seedItem, movementList] = await Promise.all([getSeed(seedId), getSeedMovements(seedId)]);
      setSeed(seedItem);
      setMovements(movementList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const unitLabel = seed ? t(SEED_UNIT_LABEL_KEY[seed.unit]) : '';
  const title = seed ? seedTitle(seed, t) : '';

  return (
    <div>
      <Link to="/farm/seeds" className="back-link">
        ← {t('seed.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{title || t('seed.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error || !seed ? (
        <div className="state-box">
          <span>{t('seed.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="list-card-grid">
            <div className="list-card">
              <div className="list-card-body">
                <span className="list-card-icon-wrap">
                  <img src={stockKindImage(seed.type)} alt="" />
                </span>
                <span className="list-card-info">
                  <span className="list-card-title">
                    {t('seed.onHand', { amount: round2(seed.amount), unit: unitLabel })}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {movements.length === 0 ? (
            <p className="empty-state">{t('seed.noHistory')}</p>
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
                      {t(movement.source === 'Harvest' ? 'seed.sourceHarvest' : 'seed.sourceManual')}
                    </span>
                    <span
                      className={`production-row-cell num strong ${movement.delta < 0 ? 'sale-delta' : 'income-delta'}`}
                    >
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
    </div>
  );
}
