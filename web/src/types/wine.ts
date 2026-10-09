export type WineStage = 'Fermenting' | 'Aging' | 'Bottled' | 'Stocked';
export type WineMovementSource = 'Production' | 'Bottling' | 'Loss' | 'Manual' | 'Market';
export type WineOperationKind = 'PunchDown' | 'Racking' | 'ToppingUp' | 'Additive' | 'Filtration' | 'Other';

export type WineBatch = {
  id: number;
  name: string;
  vintage: number;
  stage: WineStage;
  startDate: string;
  notes: string | null;
  isDeleted: boolean;
};

export type WineBatchSummary = WineBatch & {
  grapeKg: number;
  producedLiters: number;
  liters: number;
  bottles: number;
  latestSugar: number | null;
  latestAlcohol: number | null;
  latestMeasuredOn: string | null;
  readingCount: number;
  bottlingCount: number;
  operationCount: number;
  bottledCount: number;
  costs: number;
  revenue: number;
};

export type WineGrapeLine = { treeProductId: number; amount: number };

export type CreateWineBatchRequest = Omit<WineBatch, 'id' | 'stage' | 'isDeleted'> & {
  grapes: WineGrapeLine[];
};

export type WineBatchGrape = WineGrapeLine & { id: number; wineBatchId: number };

export type WineMovement = {
  id: number;
  wineBatchId: number;
  delta: number;
  bottleDelta: number;
  source: WineMovementSource;
  note: string | null;
  date: string;
  wineBottlingId: number | null;
  wineOperationId: number | null;
  marketOrderId: number | null;
  revenue: number | null;
};

export type WineStageChange = {
  id: number;
  wineBatchId: number;
  fromStage: WineStage | null;
  toStage: WineStage;
  date: string;
};

export type WineAdjustment = {
  wineBatchId: number;
  delta: number;
  bottleDelta: number;
  wineBottlingId: number | null;
  note: string | null;
  date: string | null;
};

export type WineMeasurement = {
  id: number;
  wineBatchId: number;
  date: string;
  sugar: number | null;
  temperature: number | null;
  alcohol: number | null;
  acidity: number | null;
  ph: number | null;
  freeSo2: number | null;
  totalSo2: number | null;
  note: string | null;
};

export type WineBottling = {
  id: number;
  wineBatchId: number;
  date: string;
  bottleSize: number;
  count: number;
  lot: string | null;
  cost: number | null;
};

export type WineOperation = {
  id: number;
  wineBatchId: number;
  date: string;
  kind: WineOperationKind;
  note: string | null;
  cost: number | null;
  litersLost: number | null;
};
