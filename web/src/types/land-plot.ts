export type LandPlot = {
  id: number;
  farmId: number;
  area: number;
  crop: string;
};

export type LandPlotInput = Omit<LandPlot, 'id'>;
