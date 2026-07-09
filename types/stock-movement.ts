export type StockMovementSource = 'Manual' | 'Harvest';

export type StockMovement = {
  id: number;
  stockId: number;
  delta: number;
  source: StockMovementSource;
  createdAt: string;
};
