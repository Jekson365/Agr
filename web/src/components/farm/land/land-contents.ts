import { cropImage, cropLabel } from '@/config/crop';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import type { LandPlot } from '@/types/land-plot';
import type { Livestock } from '@/types/livestock';
import type { LandContent } from './land-tile';

/**
 * What the land holds, gathered by kind: every plot of apples on it counts as apples once, and
 * two herds of cows are one cow with their heads added up. Crops come first — a piece of land is
 * named for what grows on it, and the animals are what else is kept there.
 */
export function landContents(
  farmId: number,
  plots: LandPlot[],
  livestock: Livestock[],
  t: (key: string) => string
): LandContent[] {
  const byKind = new Map<string, LandContent>();

  function add(key: string, icon: string, label: string, count: number) {
    const existing = byKind.get(key);
    if (existing) {
      existing.count += count;
    } else {
      byKind.set(key, { key, icon, label, count });
    }
  }

  // A plot counts as one of its crop: what a plot records is its share of the land, not an
  // amount, so the number here is how many plots of that crop the land carries.
  for (const plot of plots) {
    if (plot.farmId !== farmId) continue;
    add(`crop-${plot.crop}`, cropImage(plot.crop), cropLabel(plot.crop, t), 1);
  }

  // A herd counts as its head count, which is an amount of animals in its own right.
  for (const group of livestock) {
    if (group.farmId !== farmId) continue;
    add(`herd-${group.type}`, livestockImage(group.type), livestockTypeLabel(group.type, t), group.count);
  }

  return [...byKind.values()];
}

/* Soil investigations belong to a plot, not to the land it sits on, so the card's button has to
   name one. A single plot needs no asking; several do; none means there is nothing to open. */
export function plotsOf(farmId: number, plots: LandPlot[]): LandPlot[] {
  return plots.filter((plot) => plot.farmId === farmId);
}

export function soilPath(farmId: number, plotId: number): string {
  return `/farm/land/${farmId}/plot/${plotId}/soil`;
}
