import type { HarvestKind, HarvestStatus } from '@/types/harvest';
import { countsInBalance, isApplyingTransition } from './harvest-analysis';
import { HARVEST_STATUSES } from './harvest-status';

export type HarvestStatusBlock = 'seeds' | 'results' | 'settled';

export const HARVEST_STATUS_BLOCK_KEY: Record<HarvestStatusBlock, string> = {
  seeds: 'harvest.statusBlockedSeeds',
  results: 'harvest.statusBlockedResults',
  settled: 'harvest.statusBlockedSettled',
};

export type HarvestProgress = {
  kind: HarvestKind;
  seedCount: number;
  /** Recorded yield rows: HarvestResults for a crop, picked trees carrying produce for fruit. */
  resultCount: number;
};

const SOWN_INDEX = HARVEST_STATUSES.indexOf('Planting');

function crossesSowing(current: HarvestStatus, next: HarvestStatus): boolean {
  return HARVEST_STATUSES.indexOf(current) < SOWN_INDEX && HARVEST_STATUSES.indexOf(next) >= SOWN_INDEX;
}

export function harvestStatusBlock(
  current: HarvestStatus,
  next: HarvestStatus,
  progress: HarvestProgress
): HarvestStatusBlock | null {
  if (next === current) return null;
  if (countsInBalance(current)) return 'settled';
  // Sowing is a crop's step: an orchard is picked, never planted each season.
  if (progress.kind !== 'Fruit' && progress.seedCount === 0 && crossesSowing(current, next)) return 'seeds';
  if (progress.resultCount === 0 && isApplyingTransition(current, next)) return 'results';
  return null;
}
