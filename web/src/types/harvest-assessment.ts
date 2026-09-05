export type AssessmentGrade = 'A' | 'B' | 'C' | 'D';

export const ASSESSMENT_GRADES: AssessmentGrade[] = ['A', 'B', 'C', 'D'];

/** The result of grading a good in one harvest: how much came out at a band. What the band means
 *  is the good's own standard — see AssessmentCriteria.
 *  Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree good). */
export type HarvestAssessment = {
  id: number;
  harvestId: number;
  stockId: number | null;
  treeStockId: number | null;
  grade: AssessmentGrade;
  quantity: number;
  /** How much came out at this band but is spoiled. Counted against the pick beside `quantity`,
   *  never added to it. */
  wasted: number;
};

export type HarvestAssessmentLine = {
  grade: AssessmentGrade;
  quantity: number;
  wasted: number;
};

/** One good's whole split — the four bands are saved together, never row by row. */
export type HarvestAssessmentSheet = {
  harvestId: number;
  stockId: number | null;
  treeStockId: number | null;
  lines: HarvestAssessmentLine[];
};
