import { useEffect, useState } from 'react';

import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';
import { bottleLotLabel, loadBottleLots, type BottleLot } from '@/pages/wine/wine-bottle-lots';
import { getWineBatches } from '@/services/wine-batch-service';
import type { WineBatchSummary } from '@/types/wine';
import { WineBottleShelf } from './wine-bottle-shelf';
import './wine-bottles.css';

export function WineBottlesPage() {
  const { t } = useLanguage();

  const [lots, setLots] = useState<BottleLot[]>([]);
  const [batches, setBatches] = useState<WineBatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [lotRows, batchRows] = await Promise.all([loadBottleLots(), getWineBatches(true)]);
      setLots(lotRows);
      setBatches(batchRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const stocked = lots.filter((lot) => {
    if (lot.left <= 0) return false;
    const batch = batches.find((row) => row.id === lot.wineBatchId);
    return batch?.stage === 'Stocked';
  });
  const sizes = [...new Set(stocked.map((lot) => lot.size))].sort((a, b) => a - b);

  function nameFor(lot: BottleLot): string {
    const batch = batches.find((row) => row.id === lot.wineBatchId);
    const label = bottleLotLabel(lot, t, batch?.name);
    return batch?.isDeleted ? `${label} · ${t('balance.removed')}` : label;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('farm.balance')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : stocked.length === 0 ? (
        <div className="empty-state">{t('wine.bottlesEmpty')}</div>
      ) : (
        <div className="wine-shelves">
          {sizes.map((size) => (
            <WineBottleShelf
              key={size}
              size={size}
              lots={stocked.filter((lot) => lot.size === size)}
              nameFor={nameFor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
