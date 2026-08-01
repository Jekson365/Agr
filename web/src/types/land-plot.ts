export type LandPlot = {
  id: number;
  farmId: number;
  area: number;
  crop: string;
  /** The fruit entry planted here, from the Fruits list. One plot per fruit on a piece of land,
   *  though other land may grow it too. Null on plots recorded before a plot named its fruit. */
  treeStockId: number | null;
  /** The stock good sown here, from the Stock list — the field-crop counterpart of
   *  `treeStockId`, under the same one-per-piece-of-land rule. A plot names one or the other,
   *  never both, so this is null whenever `treeStockId` is set. */
  stockId: number | null;
};

export type LandPlotInput = Omit<LandPlot, 'id'>;
