export type StockMovementSource = 'Manual' | 'Harvest' | 'Market' | 'Purchase';

export type StockMovement = {
  id: number;
  stockId: number;
  delta: number;
  source: StockMovementSource;
  /** The listing a Market sale came from; deleting the movement restores it. */
  marketListingId: number | null;
  createdAt: string;
};
