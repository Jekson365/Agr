export type StockHistory = {
  id: number;
  stockId: number;
  createdAt: string;
  weight: number;
};

export type StockHistoryInput = {
  stockId: number;
  weight: number;
};
