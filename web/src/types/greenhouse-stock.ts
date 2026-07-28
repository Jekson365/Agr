import type { SeedUnit } from '@/types/seed';
import type { StockType, StockUnit } from '@/types/stock';

/**
 * A good held in a greenhouse. Its own table rather than a flag on `Stock`, so the field's list
 * and the greenhouse's never mix — but typed by the same crop catalog and measured in the same
 * units, so a crop reads identically in both.
 */
export type GreenhouseStock = {
  id: number;
  greenhouseId: number;
  type: StockType;
  name: string;
  amount: number;
  unit: StockUnit;
};

/** Seed held for sowing in a greenhouse — the counterpart to `Seed` for the field. */
export type GreenhouseSeed = {
  id: number;
  greenhouseId: number;
  type: StockType;
  name: string;
  amount: number;
  unit: SeedUnit;
};

/** Creating greenhouse stock and its seed together — the server makes both or neither. */
export type GreenhouseStockWithSeedInput = {
  greenhouseId: number;
  type: StockType;
  name: string;
  amount: number;
  unit: StockUnit;
  seedAmount: number;
  seedUnit: SeedUnit;
};
