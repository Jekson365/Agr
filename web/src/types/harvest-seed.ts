/** How much of a seed was sown for a harvest — the input side of the harvest. */
export type HarvestSeed = {
  id: number;
  harvestId: number;
  seedId: number;
  amount: number;
};

export type HarvestSeedInput = Omit<HarvestSeed, 'id'>;
