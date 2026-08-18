import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getLivestock } from '@/services/livestock-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { Livestock } from '@/types/livestock';
import type { MarketListing } from '@/types/market-listing';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import {
  balancesByProductionType,
  listedFor,
  listedTotals,
  removedLivestockBalances,
  type ProductBalance,
} from './product-balance';

/**
 * What the herds have collected and how much of it is left, keyed by production type and unit —
 * litres and pieces cannot be summed, so a product is a (type, unit) pair. Like the fruit table
 * this reports what the holding yields rather than the holding, so the removed groups themselves
 * are appended by their head count once asked for.
 */
export function LivestockBalancePage() {
  const { t } = useLanguage();

  const [showRemoved, setShowRemoved] = useState(false);

  const [productions, setProductions] = useState<AnimalProduction[]>([]);
  const [productionMovements, setProductionMovements] = useState<ProductionMovement[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  /** Every group, removed ones included — the removed view names them, and the rest are filtered
   *  out of it. Read once with the page rather than on toggling, so the button is instant. */
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productionList, movementList, typeList, unitList, listingList, livestockList] = await Promise.all([
        getAllAnimalProductions(),
        getProductionMovements(),
        getProductionTypes(),
        getUnits(),
        getMarketListings({ mine: true }),
        getLivestock(true),
      ]);
      setProductions(productionList);
      setProductionMovements(movementList);
      setProductionTypes(typeList);
      setUnits(unitList);
      setListings(listingList);
      setLivestock(livestockList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const listed = listedTotals(listings);
  const balances = [
    ...balancesByProductionType(productions, productionMovements, productionTypes, units, t),
    ...(showRemoved ? removedLivestockBalances(livestock, t) : []),
  ];

  return (
    <BalanceLayout
      backTo="/farm/livestock"
      backLabel={t('farm.livestock')}
      loading={loading}
      error={error}
      onRetry={load}
      removed={{
        has: livestock.some((group) => group.isDeleted),
        showing: showRemoved,
        onToggle: () => setShowRemoved((prev) => !prev),
      }}
    >
      <BalanceColumn
        productHeader={t('balance.colProduct')}
        amountHeader={t('balance.colCollected')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('balance.emptyLivestock')}
        rows={balances}
        listedFor={(row: ProductBalance) => listedFor(row, listed)}
      />
    </BalanceLayout>
  );
}
