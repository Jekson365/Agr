// A fruit type is now an open set — the built-in defaults plus whatever custom FruitKinds a
// user has added (see services/fruit-kind-service.ts) — so it's a plain string, not a union.
export type FruitType = string;
export type TreeStockUnit = 'Kilogram' | 'Box';

export type TreeStock = {
  id: number;
  type: FruitType;
  name: string;
  amount: number;
  unit: TreeStockUnit;
  landPlotId: number | null;
};

export type TreeStockInput = Omit<TreeStock, 'id'>;
