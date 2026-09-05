import { fitPlanting } from '@/config/orchard-fit';
import type { PlantingPattern, PlantingPlan } from '@/config/orchard-layout';
import { PLANTING_PATTERN_DEFAULTS } from '@/config/planting-patterns';
import { parseTerritory, type TerritoryPoint } from '@/config/territory';
import type { OrchardBlock } from '@/types/orchard-block';
import type { TreeStock } from '@/types/tree-stock';
import type { PatternDraft } from './pattern-controls';

/** A block shown alongside the one in hand, already laid out from what was saved for it. */
export type ShownPlan = {
  id: number;
  outline: TerritoryPoint[];
  pattern: PlantingPattern;
  plan: PlantingPlan;
};

/** The controls' starting values for an orchard: its own saved ones, or the pattern's defaults
 *  where nothing has been placed yet. */
export function draftOf(block: OrchardBlock | null): PatternDraft {
  const pattern = block?.pattern ?? 'Square';
  const defaults = PLANTING_PATTERN_DEFAULTS[pattern];
  return {
    pattern,
    treeSpacing: String(block?.treeSpacing ?? defaults.treeSpacing),
    rowSpacing: String(block?.rowSpacing ?? defaults.rowSpacing),
    rotation: String(block?.rotation ?? 0),
  };
}

/** Every orchard on the map other than the one being edited, laid out from its saved block and
 *  its own tree count. */
export function buildShownPlans(
  selectedIds: number[],
  activeId: number | null,
  blocks: OrchardBlock[],
  orchards: TreeStock[]
): ShownPlan[] {
  return selectedIds
    .filter((id) => id !== activeId)
    .flatMap((id) => {
      const block = blocks.find((row) => row.treeStockId === id);
      const orchard = orchards.find((row) => row.id === id);
      if (!block || !orchard) return [];

      const outline = parseTerritory(block.boundary);
      if (outline.length < 3) return [];

      return [
        {
          id,
          outline,
          pattern: block.pattern,
          plan: fitPlanting(
            outline,
            block.pattern,
            block.treeSpacing,
            block.rowSpacing,
            block.rotation,
            Math.floor(orchard.amount)
          ),
        },
      ];
    });
}
