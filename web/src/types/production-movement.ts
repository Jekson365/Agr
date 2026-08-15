export type ProductionMovementSource = 'Manual' | 'Market';

/**
 * A single change to a livestock-production balance. Production records themselves are
 * append-only collections; sales and other deductions are logged here, keyed by the same
 * production type + unit pair the balances are computed per.
 *
 * The meat a realized animal was taken for is not one of these: its record is a collection like
 * any other and adds through its own row, so an entry here beside it would count it twice.
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
