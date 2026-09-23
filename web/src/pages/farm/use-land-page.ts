import { useCallback, useEffect, useState } from 'react';

import { getFarms } from '@/services/farm-service';
import { getAllLandPlots } from '@/services/land-plot-service';
import { getLivestock } from '@/services/livestock-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import type { Livestock } from '@/types/livestock';

export function useLandPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  /** What the cards say each piece of land holds: the plots planted on it and the herds kept
   *  there. */
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only the land itself decides whether this page loaded. The rest fills in what each card
      // holds — worth showing the land without when any of it can't be read.
      const [farmList, plotList, livestockList] = await Promise.all([
        getFarms(),
        getAllLandPlots().catch(() => [] as LandPlot[]),
        getLivestock().catch(() => [] as Livestock[]),
      ]);
      setFarms(farmList);
      setPlots(plotList);
      setLivestock(livestockList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { farms, setFarms, plots, livestock, loading, error, setError, load };
}
