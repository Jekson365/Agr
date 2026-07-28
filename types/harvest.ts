export type HarvestStatus = 'Planning' | 'Planting' | 'Harvested';

export type Harvest = {
  id: number;
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  status: HarvestStatus;
  /**
   * ISO date (YYYY-MM-DD) the crop is expected to be picked, set while planning. Null when the
   * harvest was logged after the fact. Distinct from `date`, the record's own date that
   * reporting groups by — a non-Harvested harvest past this date is overdue.
   */
  expectedHarvestDate: string | null;
  /** The farm/land this harvest belongs to. */
  farmId: number | null;
  /** An optional, more specific plot within farmId. */
  landPlotId: number | null;
  /** Expense breakdown, entered once the harvest is complete. */
  equipmentCost: number | null;
  workersCost: number | null;
  fuelCost: number | null;
  otherCost: number | null;
  /**
   * Revenue earned from this harvest's yield. Only editable on the web client today, but it must
   * round-trip here too — a mobile update sends the whole Harvest, so omitting the field would
   * null out a figure entered on the web.
   */
  revenue: number | null;
};

export type HarvestInput = Omit<Harvest, 'id'>;
