import type { StockMovementSource } from '@/types/stock-movement';

/** One row of the plant/fruit stock-movement report — a movement joined with the product it
 * changed. Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree
 * good). Mirrors the server's Server.Models.Reports.StockMovementReportRow. */
export type StockMovementReportRow = {
  id: number;
  stockId: number | null;
  treeStockId: number | null;
  name: string;
  type: string;
  unit: string;
  delta: number;
  source: StockMovementSource;
  /** The harvest a Harvest-sourced movement came from; null for manual edits and market sales. */
  harvestTitle: string | null;
  createdAt: string;
};

/** Which catalog a row's `typeName` belongs to — picks the label and icon lookup on this side. */
export type ReportGoodKind = 'stock' | 'tree' | 'treeProduct' | 'seed' | 'productionType';

export type ReportCategory = 'crop' | 'livestock' | 'fruit' | 'greenhouse';

/**
 * The period filter, sent to the server rather than applied here. `all` needs no other field.
 */
export type ReportPeriodQuery = {
  mode: 'all' | 'year' | 'quarter' | 'custom';
  year?: number;
  quarter?: number;
  from?: string | null;
  to?: string | null;
};

export type ReportValuePoint = { day: string; value: number };

/**
 * One selectable series. The server sends the raw names; the label and icon are resolved here,
 * where the translations and the artwork live.
 */
export type ReportSeries = {
  key: string;
  name: string;
  typeName: string;
  kind: ReportGoodKind;
  unit: string;
};

export type ReportGroup = {
  day: string;
  /** A harvest title; empty means the group is a day and should be labelled with one. */
  label: string;
  values: Record<string, number>;
};

export type ReportOverview = {
  value: ReportValuePoint[];
  series: ReportSeries[];
  groups: ReportGroup[];
};

export type ReportGood = {
  name: string;
  typeName: string;
  kind: ReportGoodKind;
  amount: number;
  unit: string;
};

export type ReportDayHarvest = {
  harvestId: number;
  title: string;
  isFruit: boolean;
  revenue: number;
  /** Fixed costs plus chemicals, already totalled — never a partial figure. */
  expenses: number;
  net: number;
  planned: ReportGood[];
  /** Seed sown for a crop harvest, trees picked for a fruit one. */
  input: ReportGood[];
  harvested: ReportGood[];
};

export type ReportDayProduction = {
  productionId: number;
  typeName: string;
  quantity: number;
  unit: string;
  value: number;
};

export type ReportDayDetails = {
  day: string;
  harvests: ReportDayHarvest[];
  productions: ReportDayProduction[];
};

export type ReportSeriesRecord = { label: string; day: string; amount: number };

export type ReportSeriesDetails = {
  key: string;
  total: number;
  records: ReportSeriesRecord[];
};
