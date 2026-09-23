import { useMemo } from 'react';

import { fitPlanting } from '@/config/orchard-fit';
import { EMPTY_PLAN, type PlantingPattern } from '@/config/orchard-layout';
import { PLANTING_PATTERN_DEFAULTS } from '@/config/planting-patterns';
import type { TerritoryPoint } from '@/config/territory';
import type { OrchardBlock } from '@/types/orchard-block';

/** The spacings as the controls hold them: what was typed, not what the plan settled on. Writing
 *  the answer back into the field being typed in freezes it. */
export type LayoutDraft = {
  pattern: PlantingPattern;
  treeSpacing: string;
  rowSpacing: string;
  rotation: string;
};

/** What a first layout starts as: the square pattern's own spacings, unrotated. */
export function blankDraft(): LayoutDraft {
  const defaults = PLANTING_PATTERN_DEFAULTS.Square;
  return {
    pattern: 'Square',
    treeSpacing: String(defaults.treeSpacing),
    rowSpacing: String(defaults.rowSpacing),
    rotation: '0',
  };
}

export function draftOfBlock(block: OrchardBlock): LayoutDraft {
  return {
    pattern: block.pattern,
    treeSpacing: String(block.treeSpacing),
    rowSpacing: String(block.rowSpacing),
    rotation: String(block.rotation),
  };
}

export function sameDraft(a: LayoutDraft, b: LayoutDraft): boolean {
  return (
    a.pattern === b.pattern &&
    Number(a.treeSpacing) === Number(b.treeSpacing) &&
    Number(a.rowSpacing) === Number(b.rowSpacing) &&
    Number(a.rotation) === Number(b.rotation)
  );
}

/**
 * The orchard's trees laid out on the ground it was given. Computed here rather than inside the
 * drawing so the controls beside it read the same answer — and once, since a fit is a binary search
 * over the whole outline.
 */
export function useOrchardPlan(outline: TerritoryPoint[], draft: LayoutDraft, treeCount: number) {
  return useMemo(
    () =>
      outline.length < 3
        ? EMPTY_PLAN
        : fitPlanting(
            outline,
            draft.pattern,
            Number(draft.treeSpacing) || 0,
            Number(draft.rowSpacing) || 0,
            Number(draft.rotation) || 0,
            treeCount
          ),
    [outline, draft, treeCount]
  );
}
