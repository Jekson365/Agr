export type StockKind = {
  id: number;
  name: string;
};

export type StockKindInput = Omit<StockKind, 'id'>;
