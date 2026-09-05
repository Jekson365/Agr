/** A dated note against a harvest — what happened on one day of it. */
export type HarvestEvent = {
  id: number;
  harvestId: number;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  description: string;
};

export type HarvestEventInput = Omit<HarvestEvent, 'id'>;
