import type { AssessmentGrade } from '@/types/harvest-assessment';

/** What a band means for one good. Every figure is null where it is not part of the standard —
 *  0 means the standard is zero. Belongs to exactly one of stockId / treeStockId. */
export type AssessmentCriteria = {
  id: number;
  stockId: number | null;
  treeStockId: number | null;
  grade: AssessmentGrade;
  /** False for a band the farm has switched off: kept, with everything it was defined as, but
   *  not offered when a harvest is graded. */
  isActive: boolean;
  sizeFrom: number | null;
  sizeTo: number | null;
  weightFrom: number | null;
  weightTo: number | null;
  /** Percentages, 0–100. */
  damaged: number | null;
  rotten: number | null;
  moisture: number | null;
  color: string;
};

export type AssessmentCriteriaLine = Omit<AssessmentCriteria, 'id' | 'stockId' | 'treeStockId'>;

/** A good's whole standard — the bands are saved together, never row by row. */
export type AssessmentCriteriaSheet = {
  stockId: number | null;
  treeStockId: number | null;
  lines: AssessmentCriteriaLine[];
};
