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
};

export type SeedInput = Omit<Seed, 'id'>;
