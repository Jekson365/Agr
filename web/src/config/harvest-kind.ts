import type { HarvestKind } from '@/types/harvest';

export function picksPlants(kind: HarvestKind | undefined): boolean {
  return kind === 'Fruit' || kind === 'Wine';
}

export function pickedYieldCount(
  kind: HarvestKind,
  trees: { harvestedAmount: number }[],
  results: unknown[]
): number {
  return picksPlants(kind) ? trees.filter((tree) => tree.harvestedAmount > 0).length : results.length;
}
