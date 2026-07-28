/** How much of a GreenhouseStock good is planned for a greenhouse harvest — always points at
 * greenhouse stock, since a greenhouse has no orchard equivalent to pick from. */
export type GreenhouseHarvestItem = {
  id: number;
  greenhouseHarvestId: number;
  greenhouseStockId: number;
  amount: number;
  /** The unit the plan is expressed in. May differ from the unit the target good is stocked in. */
  unit: string;
};

export type GreenhouseHarvestItemInput = Omit<GreenhouseHarvestItem, 'id'>;
