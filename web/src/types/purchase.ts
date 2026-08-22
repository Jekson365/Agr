export type PurchaseItemKind =
  | 'Livestock'
  | 'LivestockProduction'
  | 'TreeStock'
  | 'TreeProduct'
  | 'Stock'
  | 'Seed'
  | 'Equipment';

export type PurchaseItem = {
  id: number;
  purchaseDocumentId: number;
  kind: PurchaseItemKind;
  targetId: number;
  unitId: number | null;
  name: string;
  quantity: number;
  price: number;
};

export type PurchaseDocument = {
  id: number;
  seller: string;
  date: string;
  note: string | null;
  createdAt: string;
  total: number;
  items: PurchaseItem[];
};

export type PurchaseItemInput = {
  kind: PurchaseItemKind;
  targetId: number;
  unitId: number | null;
  quantity: number;
  price: number;
};

export type PurchaseInput = {
  seller: string;
  date: string | null;
  note: string | null;
  items: PurchaseItemInput[];
};
