import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByGreenhouseStock } from './product-balance';

/**
 * What the greenhouses hold. The plainest of the four: greenhouse stock carries its own amount, so
 * there is no ledger to sum, no removed rows to reveal (it is hard-deleted), and the marketplace
 * has no greenhouse category — so nothing it could be holding of this produce either.
 */
export function GreenhouseBalancePage() {
  const { t } = useLanguage();

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

  return (
    <BalanceLayout
      backTo="/farm/greenhouse"
      backLabel={t('farm.greenhouse')}
      loading={loading}
      error={error}
      onRetry={load}
    >
      <BalanceColumn
        productHeader={t('balance.colPlant')}
        amountHeader={t('balance.colBalance')}
        emptyLabel={t('balance.emptyGreenhouse')}
        rows={balancesByGreenhouseStock(stock, t)}
      />
    </BalanceLayout>
  );
}
