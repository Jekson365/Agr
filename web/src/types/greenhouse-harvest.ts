import type { GreenhouseHarvestResult } from '@/types/greenhouse-harvest-result';
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

/** A harvest with the yield it recorded — how the greenhouse page lists one, in a single call
 *  rather than a results request per row. */
export type GreenhouseHarvestSummary = {
  harvest: GreenhouseHarvest;
  results: GreenhouseHarvestResult[];
};

/** What the greenhouse page's filter panel narrows its list by. Applied by the server, before the
 *  cap, so they search the whole history rather than the rows already on screen. */
export type GreenhouseHarvestFilters = {
  status: HarvestStatus | null;
  /** ISO dates (YYYY-MM-DD), inclusive; null for an open end. */
  from: string | null;
  to: string | null;
};
