// A stock type is now an open set — the built-in defaults plus whatever custom StockKinds a
// user has added (see services/stock-kind-service.ts) — so it's a plain string, not a union.
export type StockType = string;
export type StockUnit = 'Kilogram' | 'Quantity' | 'Liter';

export type Stock = {
  id: number;
  type: StockType;
  name: string;
  amount: number;
  unit: StockUnit;
  /** Removed from the stock page: the row is kept for the history recorded against it, but it is
   *  hidden from the list and no longer offered as a good to pick. Only rows fetched with
   *  `getStock(true)` can carry it — the plain call leaves them out server-side. */
  isDeleted: boolean;
};

export type StockInput = Omit<Stock, 'id' | 'isDeleted'>;
