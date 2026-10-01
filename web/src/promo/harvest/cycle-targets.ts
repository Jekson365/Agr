export type Spot = { x: number; y: number };

const STAGE_X = [616, 766, 915, 1064, 1213, 1362, 1511, 1661];
const STAGE_Y = 597;
const STAGE_Y_WITH_KPI = 704;

export const TARGETS = {
  start: { x: 1560, y: 1000 },
  add: { x: 1651, y: 356 },
  seed: { x: 756, y: 877 },
  stages: STAGE_X.map((x) => ({ x, y: STAGE_Y })),
  harvested: { x: STAGE_X[6], y: STAGE_Y },
  balance: { x: STAGE_X[7], y: STAGE_Y_WITH_KPI },
  afterHarvest: { x: 1250, y: 985 },
  overview: { x: 1040, y: 778 },
  overviewRest: { x: 1095, y: 545 },
  gradingRest: { x: 1290, y: 545 },
  chemicalsRest: { x: 1488, y: 545 },
  grading: { x: 1237, y: 478 },
  chemicals: { x: 1433, y: 478 },
  exit: { x: 1360, y: 990 },
};
