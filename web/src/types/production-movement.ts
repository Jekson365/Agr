export type ProductionMovementSource = 'Manual' | 'Market';

/**
 * A single change to a livestock-production balance. Production records themselves are
 * append-only collections; sales and other deductions are logged here, keyed by the same
 * production type + unit pair the balances are computed per.
 */
export type ProductionMovement = {
  id: number;
  productionTypeId: number;
  unitId: number;
  /** The listing this sale came from, if any — rolling the sale back also restores it. */
  marketListingId: number | null;
  /** Signed change to the balance — negative for a sale. */
  delta: number;
  source: ProductionMovementSource;
  createdAt: string;
};
