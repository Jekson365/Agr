export type StockFeed = {
  id: number;
  livestockId: number;
  stockId: number;
  amount: number;
};

export type StockFeedInput = Omit<StockFeed, 'id'>;
