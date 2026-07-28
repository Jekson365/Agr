/** What a livestock group is fed: a link to a stock item and the amount per feeding. */
export type StockFeed = {
  id: number;
  livestockId: number;
  stockId: number;
  amount: number;
};

export type StockFeedInput = Omit<StockFeed, 'id'>;
