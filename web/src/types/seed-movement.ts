export type SeedMovementSource = 'Manual' | 'Harvest';

/** A single change to a seed's amount — negative when seed was sown for a harvest. */
export type SeedMovement = {
  id: number;
  seedId: number;
  harvestSeedId: number | null;
  delta: number;
  source: SeedMovementSource;
  createdAt: string;
};
