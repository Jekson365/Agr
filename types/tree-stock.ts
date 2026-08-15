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
  /** The one product these trees yield, from the tree-product catalog. Required when a fruit is
   *  added, and no two stocks may name the same product. Null only on fruit recorded before it
   *  was asked for. */
  treeProductId: number | null;
};

export type TreeStockInput = Omit<TreeStock, 'id'>;
