import type { HarvestStatus } from '@/types/harvest';

export type HarvestStatusChange = {
  id: number;
  harvestId: number;
  fromStatus: HarvestStatus | null;
  toStatus: HarvestStatus;
  date: string;
  note: string | null;
  createdAt: string;
};
