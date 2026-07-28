import type { HarvestStatus } from '@/types/harvest';

/**
 * A harvest taken from a greenhouse. Its own record rather than a `Harvest` kind: it belongs to a
 * greenhouse instead of a farm or plot, and carries none of the planned-item/result machinery.
 */
export type GreenhouseHarvest = {
  id: number;
  /** The greenhouse it was taken from. Required. */
  greenhouseId: number;
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  status: HarvestStatus;
  /** ISO date the crop is expected to be picked, set while planning. */
  expectedHarvestDate: string | null;
  equipmentCost: number | null;
  workersCost: number | null;
  fuelCost: number | null;
  otherCost: number | null;
  revenue: number | null;
};

export type GreenhouseHarvestInput = Omit<GreenhouseHarvest, 'id'>;
