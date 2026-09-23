import { useEffect, useMemo, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { getAllLandPlots } from '@/services/land-plot-service';
import { getOrchardBlocks } from '@/services/orchard-block-service';
import { getTreeSpotTreatments } from '@/services/tree-spot-treatment-service';
import { getTreeStock } from '@/services/tree-stock-service';
import { createTreeTreatment, deleteTreeTreatment, getTreeTreatments } from '@/services/tree-treatment-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import type { OrchardBlock } from '@/types/orchard-block';
import type { TreeSpotTreatment } from '@/types/tree-spot-treatment';
import type { TreeStock } from '@/types/tree-stock';
import type { TreeTreatment } from '@/types/tree-treatment';

export function cellKey(treeStockId: number, date: string): string {
  return `${treeStockId}|${date}`;
}

export function useTreatments() {
  const { t } = useLanguage();

  const [orchards, setOrchards] = useState<TreeStock[]>([]);
  const [treatments, setTreatments] = useState<TreeTreatment[]>([]);
  /** Where each orchard's trees stand, read only here — the calendar shows a block, it never
   *  edits one. Missing blocks are a normal state, not an error: an orchard is planted before it
   *  is laid out. */
  const [blocks, setBlocks] = useState<OrchardBlock[]>([]);
  /** Every orchard's per-tree records, read once rather than per orchard: the panel opens on a
   *  click and a request there would be a spinner between picking a tree and seeing its history. */
  const [spots, setSpots] = useState<TreeSpotTreatment[]>([]);
  /** Only so a block being drawn for the first time can start from the land it sits on. */
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [stocks, rows, blockList, spotList, plotList, farmList] = await Promise.all([
        getTreeStock(),
        getTreeTreatments(),
        getOrchardBlocks().catch(() => [] as OrchardBlock[]),
        getTreeSpotTreatments().catch(() => [] as TreeSpotTreatment[]),
        getAllLandPlots().catch(() => [] as LandPlot[]),
        getFarms().catch(() => [] as Farm[]),
      ]);
      setOrchards(stocks);
      setTreatments(rows);
      setBlocks(blockList);
      setSpots(spotList);
      setPlots(plotList);
      setFarms(farmList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const dayTreatments = useMemo(() => {
    const cells = new Map<string, TreeTreatment[]>();
    for (const row of treatments) {
      const key = cellKey(row.treeStockId, row.date.slice(0, 10));
      const before = cells.get(key);
      if (before) before.push(row);
      else cells.set(key, [row]);
    }
    return cells;
  }, [treatments]);

  function treatmentsOn(treeStockId: number, date: string): TreeTreatment[] {
    return dayTreatments.get(cellKey(treeStockId, date)) ?? [];
  }

  async function toggle(treeStockId: number, date: string, type: string) {
    const existing = treatmentsOn(treeStockId, date).find((row) => row.type === type);

    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await deleteTreeTreatment(existing.id);
        setTreatments((prev) => prev.filter((row) => row.id !== existing.id));
        return;
      }
      const created = await createTreeTreatment({ treeStockId, date, type });
      setTreatments((prev) => [...prev, created]);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function clearDay(treeStockId: number, date: string) {
    const rows = treatmentsOn(treeStockId, date);
    if (rows.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      await Promise.all(rows.map((row) => deleteTreeTreatment(row.id)));
      setTreatments((prev) => prev.filter((row) => !rows.some((gone) => gone.id === row.id)));
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return {
    orchards,
    blocks,
    setBlocks,
    plots,
    farms,
    spots,
    setSpots,
    dayTreatments,
    treatmentsOn,
    toggle,
    clearDay,
    loading,
    saving,
    error,
    load,
  };
}
