// A seed's type is a StockKind name — seed shares the crop catalog with plant stock, so the
// same icons and labels apply to the seed and to the produce it grows into.
export type SeedType = string;
export type SeedUnit = 'Kilogram' | 'Gram' | 'Quantity';

export type Seed = {
  id: number;
  type: SeedType;
  name: string;
  amount: number;
  unit: SeedUnit;
  /** Set when the stock this seed grows into was removed — the pair goes together. Hidden from
   *  the seeds page and the sowing picker; only `getSeeds(true)` returns such rows. */
  isDeleted: boolean;
};
