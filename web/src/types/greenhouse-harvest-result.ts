/** The final, actual yield of a GreenhouseStock good, recorded once a greenhouse harvest is
 * marked Harvested. */
export type GreenhouseHarvestResult = {
  id: number;
  greenhouseHarvestId: number;
  greenhouseStockId: number;
  amount: number;
};

export type GreenhouseHarvestResultInput = Omit<GreenhouseHarvestResult, 'id'>;
