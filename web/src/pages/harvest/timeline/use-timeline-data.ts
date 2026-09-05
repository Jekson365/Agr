import { useEffect, useMemo, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getGreenhouseHarvestSeeds } from '@/services/greenhouse-harvest-seed-service';
import { getGreenhouseHarvests, updateGreenhouseHarvest } from '@/services/greenhouse-harvest-service';
import { getGreenhouseSeeds } from '@/services/greenhouse-stock-service';
import { getHarvestEvents } from '@/services/harvest-event-service';
import { getHarvestItems } from '@/services/harvest-item-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvestSeeds } from '@/services/harvest-seed-service';
import { getHarvests, updateHarvest } from '@/services/harvest-service';
import { getHarvestTrees } from '@/services/harvest-tree-service';
import { getSeeds } from '@/services/seed-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import { buildSeedIcons, buildSeedRows, emptySeedInput, type SeedInput } from './harvest-timeline-seeds';
import {
  buildTargetOptions,
  buildTargets,
  emptyTargetRows,
  type TargetRows,
} from './harvest-timeline-targets';
import { fromGreenhouseHarvest, fromHarvest, harvestIdOf, type TimelineHarvest } from './harvest-timeline-spans';
import { useDayMarks } from './use-day-marks';

export type HarvestPatch = { status?: HarvestStatus; date?: string; expectedHarvestDate?: string | null };

export { harvestIdOf };

export function useTimelineData(greenhouseOn: boolean) {
  const { t } = useLanguage();

  const [fieldHarvests, setFieldHarvests] = useState<Harvest[]>([]);
  const [greenhouseHarvests, setGreenhouseHarvests] = useState<GreenhouseHarvest[]>([]);
  const [seedRows, setSeedRows] = useState<Omit<SeedInput, 'harvests'>>(emptySeedInput);
  const [targetRows, setTargetRows] = useState<TargetRows>(emptyTargetRows);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greenhouseOn]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [
        field,
        greenhouse,
        harvestSeeds,
        greenhouseHarvestSeeds,
        seeds,
        greenhouseSeeds,
        eventList,
        items,
        results,
        trees,
        stocks,
        treeStocks,
      ] = await Promise.all([
        getHarvests(),
        greenhouseOn ? getGreenhouseHarvests().catch(() => []) : Promise.resolve([]),
        getHarvestSeeds().catch(() => []),
        greenhouseOn ? getGreenhouseHarvestSeeds().catch(() => []) : Promise.resolve([]),
        getSeeds(true).catch(() => []),
        greenhouseOn ? getGreenhouseSeeds().catch(() => []) : Promise.resolve([]),
        getHarvestEvents().catch(() => []),
        getHarvestItems().catch(() => []),
        getHarvestResults().catch(() => []),
        getHarvestTrees().catch(() => []),
        getStock(true).catch(() => []),
        getTreeStock(true).catch(() => []),
      ]);
      setFieldHarvests(field);
      setGreenhouseHarvests(greenhouse);
      setSeedRows({ harvestSeeds, greenhouseHarvestSeeds, seeds, greenhouseSeeds });
      marks.setEvents(eventList);
      setTargetRows({ items, results, trees, stocks, treeStocks });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const harvests = useMemo(
    () => [...fieldHarvests.map(fromHarvest), ...greenhouseHarvests.map(fromGreenhouseHarvest)],
    [fieldHarvests, greenhouseHarvests]
  );

  const marks = useDayMarks(harvests, t);

  const seedIcons = useMemo(() => buildSeedIcons({ ...seedRows, harvests }), [seedRows, harvests]);
  const seedDetails = useMemo(() => buildSeedRows({ ...seedRows, harvests }, t), [seedRows, harvests, t]);

  const targets = useMemo(() => buildTargets(targetRows, harvests), [targetRows, harvests]);
  const targetOptions = useMemo(
    () => buildTargetOptions(targetRows, targets, t),
    [targetRows, targets, t]
  );

  async function patchHarvest(target: TimelineHarvest, patch: HarvestPatch) {
    if (saving) return;
    const id = harvestIdOf(target);
    setSaving(true);
    setError(null);
    try {
      if (target.source === 'greenhouse') {
        const raw = greenhouseHarvests.find((row) => row.id === id);
        if (!raw) return;
        const next = { ...raw, ...patch };
        await updateGreenhouseHarvest(id, next);
        setGreenhouseHarvests((prev) => prev.map((row) => (row.id === id ? next : row)));
        return;
      }

      const raw = fieldHarvests.find((row) => row.id === id);
      if (!raw) return;
      const next = { ...raw, ...patch };
      await updateHarvest(id, next);
      setFieldHarvests((prev) => prev.map((row) => (row.id === id ? next : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function upsertHarvest(harvest: Harvest, isNew: boolean) {
    setFieldHarvests((prev) =>
      isNew ? [harvest, ...prev] : prev.map((row) => (row.id === harvest.id ? harvest : row))
    );
  }

  return {
    harvests,
    seedIcons,
    seedDetails,
    targets,
    targetOptions,
    dayActivities: marks.dayActivities,
    activitiesFor: marks.activitiesFor,
    toggleActivity: marks.toggleActivity,
    unmarkDay: marks.unmarkDay,
    loading,
    saving: saving || marks.saving,
    error: error ?? marks.error,
    patchHarvest,
    upsertHarvest,
  };
}
