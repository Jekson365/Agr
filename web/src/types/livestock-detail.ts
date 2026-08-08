export type Gender = 'Male' | 'Female';

export type LivestockDetail = {
  id: number;
  livestockId: number;
  code: string;
  imagePath: string;
  /** ISO date string (YYYY-MM-DD) or null when unknown. */
  bornDate: string | null;
  gender: Gender | null;
  /** The two animals this one came from, when it was recorded as a breeding result. Null for an
   *  animal entered on its own, and nulled again if a parent is later removed. */
  parentOneId: number | null;
  parentTwoId: number | null;
};

export type LivestockDetailInput = Omit<LivestockDetail, 'id'>;
