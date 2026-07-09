export type HarvestStatus = 'Planning' | 'Planting' | 'Harvested';

export type Harvest = {
  id: number;
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  status: HarvestStatus;
  landPlotId: number | null;
};

export type HarvestInput = Omit<Harvest, 'id'>;
