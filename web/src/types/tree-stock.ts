// A fruit type is now an open set — the built-in defaults plus whatever custom FruitKinds a
// user has added (see services/fruit-kind-service.ts) — so it's a plain string, not a union.
export type FruitType = string;
// New fruit is always counted in trees ('Plant'); the other two only appear on rows created
// before that, and are kept so their stored amounts keep their meaning.
export type TreeStockUnit = 'Kilogram' | 'Box' | 'Plant';

export type TreeStock = {
  id: number;
  type: FruitType;
  name: string;
  amount: number;
  unit: TreeStockUnit;
  landPlotId: number | null;
  /** The product these trees yield, from the tree-product catalog. Null until assigned. */
  treeProductId: number | null;
  /** Whether the fruit has been removed from the fruit page. Removing marks rather than drops, so
   *  everything recorded against it still reads back; it is left out of the list and of the balance
   *  until the removed holdings are asked for. */
  isDeleted: boolean;
};

export type TreeStockInput = Omit<TreeStock, 'id' | 'isDeleted'>;
