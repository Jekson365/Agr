/** How much greenhouse seed was sown for a greenhouse harvest — the input side, recorded while
 * planning. */
export type GreenhouseHarvestSeed = {
  id: number;
  greenhouseHarvestId: number;
  greenhouseSeedId: number;
  amount: number;
};

export type GreenhouseHarvestSeedInput = Omit<GreenhouseHarvestSeed, 'id'>;
