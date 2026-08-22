export type BalanceAdjustTarget =
  | { kind: 'stock'; stockId: number }
  | { kind: 'treeProduct'; treeProductId: number }
  | { kind: 'production'; productionTypeId: number; unitId: number }
  | { kind: 'greenhouseStock'; greenhouseStockId: number };

export type BalanceAdjustment = {
  delta: number;
  note: string | null;
  date: string | null;
};
