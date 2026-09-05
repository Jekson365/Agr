import { useCallback, useEffect, useMemo, useState } from 'react';

import { fitPlanting } from '@/config/orchard-fit';
import { EMPTY_PLAN } from '@/config/orchard-layout';
import { PLANTING_PATTERN_DEFAULTS } from '@/config/planting-patterns';
import { parseTerritory, serializeTerritory, type TerritoryPoint } from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';
import { createOrchardBlock, deleteOrchardBlock, getOrchardBlocks, updateOrchardBlock } from '@/services/orchard-block-service';
import { getFarms } from '@/services/farm-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { OrchardBlock } from '@/types/orchard-block';
import type { TreeStock } from '@/types/tree-stock';
import type { PatternDraft } from './pattern-controls';
import { buildShownPlans, draftOf } from './positioning-plans';

export function usePositioning() {
  const { t } = useLanguage();

  const [orchards, setOrchards] = useState<TreeStock[]>([]);
  const [blocks, setBlocks] = useState<OrchardBlock[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  /** Which orchards are drawn on the map. The first is the one being edited — the others are
   *  shown in their own colours so a block can be placed against what is already planted. */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [boundary, setBoundary] = useState<TerritoryPoint[]>([]);
  const [draft, setDraft] = useState<PatternDraft>(draftOf(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [stock, blockList, farmList] = await Promise.all([
        getTreeStock(),
        getOrchardBlocks(),
        getFarms().catch(() => []),
      ]);
      setOrchards(stock);
      setBlocks(blockList);
      setFarms(farmList);
      setActiveId((prev) => prev ?? stock[0]?.id ?? null);
      setSelectedIds((prev) => (prev.length > 0 ? prev : stock[0] ? [stock[0].id] : []));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const block = useMemo(
    () => blocks.find((row) => row.treeStockId === activeId) ?? null,
    [blocks, activeId]
  );

  /**
   * A click brings an orchard into focus; a click on the one already in focus takes it off the
   * map. Focus moves to whatever is still shown, so the pane is never editing something hidden.
   */
  const toggle = useCallback(
    (id: number) => {
      if (!selectedIds.includes(id)) {
        setSelectedIds((prev) => [...prev, id]);
        setActiveId(id);
        return;
      }
      if (activeId !== id) {
        setActiveId(id);
        return;
      }
      const remaining = selectedIds.filter((row) => row !== id);
      setSelectedIds(remaining);
      setActiveId(remaining[0] ?? null);
    },
    [selectedIds, activeId]
  );

  // Picking another orchard loads its own outline and spacings; picking one with nothing placed
  // yet starts from the pattern's defaults and an empty map to draw on.
  useEffect(() => {
    setBoundary(block ? parseTerritory(block.boundary) : []);
    setDraft(draftOf(block));
  }, [block]);

  // Changing the pattern brings its own spacings with it, so the plan is sensible before anything
  // is typed — but only when the pattern actually changed, or every keystroke would reset them.
  const changeDraft = useCallback((next: PatternDraft) => {
    setDraft((prev) => {
      if (next.pattern === prev.pattern) return next;
      const defaults = PLANTING_PATTERN_DEFAULTS[next.pattern];
      return { ...next, treeSpacing: String(defaults.treeSpacing), rowSpacing: String(defaults.rowSpacing) };
    });
  }, []);

  const selected = orchards.find((row) => row.id === activeId) ?? null;

  // The plan is the orchard's own trees laid out on the ground it was given — the count comes
  // from the fruit stock, never from this page.
  const plan = useMemo(
    () =>
      boundary.length >= 3
        ? fitPlanting(
            boundary,
            draft.pattern,
            Number(draft.treeSpacing) || 0,
            Number(draft.rowSpacing) || 0,
            Number(draft.rotation) || 0,
            Math.floor(selected?.amount ?? 0)
          )
        : EMPTY_PLAN,
    [boundary, draft, selected?.amount]
  );

  /** The blocks shown alongside the one in hand. Kept apart from the live plan so typing a
   *  spacing does not relay every other orchard too. */
  const otherPlans = useMemo(
    () => buildShownPlans(selectedIds, activeId, blocks, orchards),
    [selectedIds, activeId, blocks, orchards]
  );

  async function save() {
    if (activeId == null || boundary.length < 3) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        treeStockId: activeId,
        boundary: serializeTerritory(boundary),
        pattern: draft.pattern,
        treeSpacing: plan.treeSpacing,
        rowSpacing: plan.rowSpacing,
        rotation: Number(draft.rotation) || 0,
        treeCount: plan.trees.length,
      };

      if (block) {
        const updated = { ...block, ...payload };
        await updateOrchardBlock(block.id, updated);
        setBlocks((prev) => prev.map((row) => (row.id === block.id ? updated : row)));
      } else {
        const created = await createOrchardBlock(payload);
        setBlocks((prev) => [...prev, created]);
      }
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    if (!block) {
      setBoundary([]);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await deleteOrchardBlock(block.id);
      setBlocks((prev) => prev.filter((row) => row.id !== block.id));
      setBoundary([]);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return {
    orchards,
    blocks,
    farms,
    selected,
    selectedIds,
    activeId,
    toggle,
    otherPlans,
    boundary,
    setBoundary,
    draft,
    changeDraft,
    plan,
    block,
    loading,
    saving,
    error,
    save,
    clear,
    load,
  };
}
