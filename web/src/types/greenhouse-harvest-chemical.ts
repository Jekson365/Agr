/** A chemical applied to a greenhouse harvest, with its cost — folded into the harvest's final
 * expenses. */
export type GreenhouseHarvestChemical = {
  id: number;
  greenhouseHarvestId: number;
  name: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  cost: number;
};

export type GreenhouseHarvestChemicalInput = Omit<GreenhouseHarvestChemical, 'id'>;
