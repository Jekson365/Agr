import type { HarvestStatus } from '@/types/harvest';
import type { HarvestStatusChange } from '@/types/harvest-status-change';

export type StageDates = Partial<Record<HarvestStatus, string>>;

export function stageDates(changes: HarvestStatusChange[]): StageDates {
  const dates: StageDates = {};
  for (const change of changes) {
    dates[change.toStatus] = change.date;
  }
  return dates;
}
