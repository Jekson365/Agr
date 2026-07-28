export type Gender = 'Male' | 'Female';

export type LivestockDetail = {
  id: number;
  livestockId: number;
  code: string;
  imagePath: string;
  /** ISO date string (YYYY-MM-DD) or null when unknown. */
  bornDate: string | null;
  gender: Gender | null;
};

export type LivestockDetailInput = Omit<LivestockDetail, 'id'>;
