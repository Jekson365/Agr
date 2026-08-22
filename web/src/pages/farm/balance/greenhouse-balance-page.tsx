import { useEffect, useState } from 'react';

import { AdjustBalanceModal } from '@/components/farm/adjust-balance-modal';
import { useLanguage } from '@/contexts/language-context';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByGreenhouseStock } from './balance-sources';
import { adjustOptions } from './product-balance';

/**
 * What the greenhouses hold. The plainest of the four: greenhouse stock carries its own amount, so
 * there is no ledger to sum, no removed rows to reveal (it is hard-deleted), and the marketplace
 * has no greenhouse category — so nothing it could be holding of this produce either.
 */
export function GreenhouseBalancePage() {
  const { t } = useLanguage();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [stock, setStock] = useState<GreenhouseStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // No greenhouse id — every greenhouse's stock, since the balance covers the whole holding.
      setStock(await getGreenhouseStock());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const balances = balancesByGreenhouseStock(stock, t);

  return (
    <BalanceLayout
      backTo="/farm/greenhouse"
      backLabel={t('farm.greenhouse')}
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <button type="button" className="add-button" onClick={() => setAdjustOpen(true)}>
          + {t('balance.adjust')}
        </button>
      }
    >
      <BalanceColumn
        productHeader={t('balance.colPlant')}
        amountHeader={t('balance.colBalance')}
        emptyLabel={t('balance.emptyGreenhouse')}
        rows={balances}
      />

      <AdjustBalanceModal open={adjustOpen} options={adjustOptions(balances)} onClose={() => setAdjustOpen(false)} onSaved={load} />
    </BalanceLayout>
  );
}
