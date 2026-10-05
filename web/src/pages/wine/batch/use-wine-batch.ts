import { useCallback, useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { loadGrapeOptions, type GrapeOption } from '@/pages/wine/wine-grape-options';
import { getWineBatch, getWineStages, updateWineBatch } from '@/services/wine-batch-service';
import { getWineGrapes } from '@/services/wine-grape-service';
import { getWineMovements } from '@/services/wine-movement-service';
import type { WineBatchGrape, WineBatchSummary, WineMovement, WineStage, WineStageChange } from '@/types/wine';

export function useWineBatch(id: number) {
  const { t } = useLanguage();

  const [batch, setBatch] = useState<WineBatchSummary | null>(null);
  const [grapes, setGrapes] = useState<WineBatchGrape[]>([]);
  const [movements, setMovements] = useState<WineMovement[]>([]);
  const [stages, setStages] = useState<WineStageChange[]>([]);
  const [grapeOptions, setGrapeOptions] = useState<GrapeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stageSaving, setStageSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [summary, grapeRows, movementRows, options] = await Promise.all([
      getWineBatch(id),
      getWineGrapes(id),
      getWineMovements(id),
      loadGrapeOptions(t),
    ]);
    setBatch(summary);
    setGrapes(grapeRows);
    setMovements(movementRows);
    setGrapeOptions(options);
  }, [id, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([refresh(), getWineStages(id).then(setStages)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, refresh]);

  useEffect(() => {
    if (id) load();
  }, [id, load]);

  async function changeStage(stage: WineStage) {
    if (!batch || stage === batch.stage) return;
    setStageSaving(true);
    try {
      await updateWineBatch({ ...batch, stage });
      setBatch({ ...batch, stage });
      setStages(await getWineStages(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStageSaving(false);
    }
  }

  return { batch, grapes, movements, stages, grapeOptions, loading, error, stageSaving, load, refresh, changeStage };
}

export type WineBatchDetail = ReturnType<typeof useWineBatch>;
