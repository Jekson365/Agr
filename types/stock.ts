// A stock type is now an open set — the built-in defaults plus whatever custom StockKinds a
// user has added (see services/stock-kind-service.ts) — so it's a plain string, not a union.
export type StockType = string;
export type StockUnit = 'Kilogram' | 'Quantity'| 'Liter';

export type Stock = {
  id: number;
  type: StockType;
  name: string;
  amount: number;
  unit: StockUnit;
};

export type StockInput = Omit<Stock, 'id'>;
