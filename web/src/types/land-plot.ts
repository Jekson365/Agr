export type LandPlot = {
  id: number;
  farmId: number;
  area: number;
  crop: string;
  /** The fruit entry planted here, from the Fruits list. One plot per fruit on a piece of land,
   *  though other land may grow it too. Null on plots recorded before a plot named its fruit. */
  treeStockId: number | null;
};

export type LandPlotInput = Omit<LandPlot, 'id'>;
