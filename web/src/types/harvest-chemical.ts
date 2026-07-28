/** A chemical applied to a harvest, with its cost — folded into the harvest's final expenses. */
export type HarvestChemical = {
  id: number;
  harvestId: number;
  name: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  cost: number;
};

export type HarvestChemicalInput = Omit<HarvestChemical, 'id'>;
