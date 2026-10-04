import { STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { CROP_FARMING_CONFIG, WINE_CONFIG } from '@/types/configuration';
import type { HarvestKind } from '@/types/harvest';
import type { SeedUnit } from '@/types/seed';
import type { StockCategory, StockUnit } from '@/types/stock';

type UnitOption = { value: string; labelKey: string };

export type SeedArea = {
  path: string;
  defaultUnit: SeedUnit;
};

export type StockArea = {
  category: StockCategory;
  harvestKind: HarvestKind;
  config: string;
  titleKey: string;
  addKey: string;
  namePlaceholderKey: string;
  stockPath: string;
  balancePath: string;
  harvestPath: string;
  harvestDetailBase: string;
  fixedType: string | null;
  defaultUnit: StockUnit;
  unitOptions: UnitOption[];
  seed: SeedArea | null;
};

export const CROP_AREA: StockArea = {
  category: 'Crop',
  harvestKind: 'Crop',
  config: CROP_FARMING_CONFIG,
  titleKey: 'farm.plantStock',
  addKey: 'farm.addStock',
  namePlaceholderKey: 'farm.stockNamePlaceholder',
  stockPath: '/farm/stock',
  balancePath: '/farm/stock/balance',
  harvestPath: '/harvest',
  harvestDetailBase: '/harvest/detail',
  fixedType: null,
  defaultUnit: 'Kilogram',
  unitOptions: STOCK_UNIT_OPTIONS,
  seed: { path: '/farm/seeds', defaultUnit: 'Kilogram' },
};

export const WINE_AREA: StockArea = {
  category: 'Wine',
  harvestKind: 'Wine',
  config: WINE_CONFIG,
  titleKey: 'wine.stockTitle',
  addKey: 'farm.addStock',
  namePlaceholderKey: 'wine.namePlaceholder',
  stockPath: '/farm/wine',
  balancePath: '/farm/wine/balance',
  harvestPath: '/farm/wine/harvest',
  harvestDetailBase: '/farm/wine/harvest',
  fixedType: 'Grape',
  defaultUnit: 'Plant',
  unitOptions: [{ value: 'Plant', labelKey: 'farm.unitPlant' }],
  seed: null,
};

export function stockAreaOf(category: StockCategory | undefined): StockArea {
  return category === 'Wine' ? WINE_AREA : CROP_AREA;
}

export function stockCategoryOf(kind: HarvestKind): StockCategory {
  return kind === 'Wine' ? 'Wine' : 'Crop';
}

export function harvestListPath(kind: HarvestKind): string {
  return kind === 'Fruit' ? '/farm/fruits/harvest' : stockAreaOf(stockCategoryOf(kind)).harvestPath;
}

export function harvestDetailPath(kind: HarvestKind, id: number): string {
  if (kind === 'Fruit') return `/farm/fruits/harvest/${id}`;
  return `${stockAreaOf(stockCategoryOf(kind)).harvestDetailBase}/${id}`;
}
