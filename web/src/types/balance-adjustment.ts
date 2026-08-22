export type BalanceAdjustTarget =
  | { kind: 'stock'; stockId: number }
  | { kind: 'treeStock'; treeStockId: number }
  | { kind: 'treeProduct'; treeProductId: number }
  | { kind: 'production'; productionTypeId: number; unitId: number }
  | { kind: 'greenhouseStock'; greenhouseStockId: number };

export type BalanceAdjustOption = {
  key: string;
  title: string;
  unitLabel: string;
  balance: number;
  target: BalanceAdjustTarget;
};

export type BalanceAdjustment = {
  delta: number;
  note: string | null;
  date: string | null;
};
