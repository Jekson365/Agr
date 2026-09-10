/** What a livestock group is fed: exactly one of a stock good, a tree product or a piece of
 *  equipment, and the amount per feeding. */
export type StockFeed = {
  id: number;
  livestockId: number;
  stockId: number | null;
  treeProductId: number | null;
  equipmentId: number | null;
  amount: number;
};

export type StockFeedInput = Omit<StockFeed, 'id'>;
