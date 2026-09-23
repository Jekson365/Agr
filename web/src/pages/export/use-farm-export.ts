import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { getEquipment } from '@/services/equipment-service';
import { getFarms } from '@/services/farm-service';
import { getGreenhouses } from '@/services/greenhouse-service';
import { getAllLandPlots } from '@/services/land-plot-service';
import { getLivestock } from '@/services/livestock-service';
import { getSeeds } from '@/services/seed-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Equipment } from '@/types/equipment';
import type { Farm } from '@/types/farm';
import type { Greenhouse } from '@/types/greenhouse';
import type { LandPlot } from '@/types/land-plot';
import type { Livestock } from '@/types/livestock';
import type { Seed } from '@/types/seed';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

export type FarmExportData = {
  farms: Farm[];
  plots: LandPlot[];
  stock: Stock[];
  seeds: Seed[];
  treeStock: TreeStock[];
  livestock: Livestock[];
  greenhouses: Greenhouse[];
  equipment: Equipment[];
};

const EMPTY: FarmExportData = {
  farms: [],
  plots: [],
  stock: [],
  seeds: [],
  treeStock: [],
  livestock: [],
  greenhouses: [],
  equipment: [],
};

export function useFarmExport() {
  const { user } = useAuth();
  const equipmentAllowed = user?.equipmentAllowed ?? false;

  const [data, setData] = useState<FarmExportData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [farms, plots, stock, seeds, treeStock, livestock, greenhouses, equipment] = await Promise.all([
        getFarms(),
        getAllLandPlots().catch(() => [] as LandPlot[]),
        getStock().catch(() => [] as Stock[]),
        getSeeds().catch(() => [] as Seed[]),
        getTreeStock().catch(() => [] as TreeStock[]),
        getLivestock().catch(() => [] as Livestock[]),
        getGreenhouses().catch(() => [] as Greenhouse[]),
        equipmentAllowed ? getEquipment().catch(() => [] as Equipment[]) : Promise.resolve([] as Equipment[]),
      ]);
      setData({ farms, plots, stock, seeds, treeStock, livestock, greenhouses, equipment });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [equipmentAllowed]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
