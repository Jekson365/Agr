export type TreeTreatment = {
  id: number;
  treeStockId: number;
  date: string;
  type: string;
};

export type TreeTreatmentInput = Omit<TreeTreatment, 'id'>;
