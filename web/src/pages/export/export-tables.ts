import { TREE_STOCK_UNIT_LABEL_KEY, fruitTypeLabel } from '@/config/fruit-kinds';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { SEED_UNIT_LABEL_KEY } from '@/config/seed-kinds';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import type { ExportColumn, ExportRow } from './export-section';
import type { FarmExportData } from './use-farm-export';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export type ExportTable = {
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
};

function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function farmNames(data: FarmExportData): Map<number, string> {
  return new Map(data.farms.map((farm) => [farm.id, farm.name]));
}

export function landsTable(data: FarmExportData, t: Translate): ExportTable {
  const plotCount = new Map<number, number>();
  for (const plot of data.plots) {
    plotCount.set(plot.farmId, (plotCount.get(plot.farmId) ?? 0) + 1);
  }

  return {
    title: t('farm.land'),
    columns: [
      { key: 'name', label: t('farm.name') },
      { key: 'area', label: t('farm.area'), num: true },
      { key: 'location', label: t('farm.location') },
      { key: 'plots', label: t('export.plots'), num: true },
    ],
    rows: data.farms.map((farm) => ({
      id: `land-${farm.id}`,
      cells: {
        name: farm.isRemoved ? `${farm.name} (${t('export.removed')})` : farm.name,
        area: `${round2(farm.area)} ${t('farm.areaUnit')}`,
        location: farm.location,
        plots: String(plotCount.get(farm.id) ?? 0),
      },
    })),
  };
}

export function plotsTable(data: FarmExportData, t: Translate): ExportTable {
  const names = farmNames(data);

  return {
    title: t('export.plots'),
    columns: [
      { key: 'land', label: t('farm.land') },
      { key: 'crop', label: t('farm.crop') },
      { key: 'area', label: t('farm.area'), num: true },
    ],
    rows: data.plots.map((plot) => ({
      id: `plot-${plot.id}`,
      cells: {
        land: names.get(plot.farmId) ?? '',
        crop: plot.crop ? stockTypeLabel(plot.crop, t) : '',
        area: `${round2(plot.area)} ${t('farm.areaUnit')}`,
      },
    })),
  };
}

export function stockTable(data: FarmExportData, t: Translate): ExportTable {
  return {
    title: t('farm.plantStock'),
    columns: [
      { key: 'type', label: t('farm.crop') },
      { key: 'name', label: t('farm.name') },
      { key: 'amount', label: t('farm.amount'), num: true },
    ],
    rows: data.stock.map((item) => ({
      id: `stock-${item.id}`,
      cells: {
        type: stockTypeLabel(item.type, t),
        name: item.name.trim(),
        amount: `${round2(item.amount)} ${t(STOCK_UNIT_LABEL_KEY[item.unit] ?? 'farm.unit')}`,
      },
    })),
  };
}

export function seedsTable(data: FarmExportData, t: Translate): ExportTable {
  return {
    title: t('seed.title'),
    columns: [
      { key: 'type', label: t('farm.crop') },
      { key: 'name', label: t('farm.name') },
      { key: 'amount', label: t('farm.amount'), num: true },
    ],
    rows: data.seeds.map((seed) => ({
      id: `seed-${seed.id}`,
      cells: {
        type: stockTypeLabel(seed.type, t),
        name: seed.name.trim(),
        amount: `${round2(seed.amount)} ${t(SEED_UNIT_LABEL_KEY[seed.unit] ?? 'farm.unit')}`,
      },
    })),
  };
}

export function treeStockTable(data: FarmExportData, t: Translate): ExportTable {
  return {
    title: t('farm.fruits'),
    columns: [
      { key: 'type', label: t('export.type') },
      { key: 'name', label: t('farm.name') },
      { key: 'amount', label: t('farm.amount'), num: true },
    ],
    rows: data.treeStock.map((item) => ({
      id: `tree-${item.id}`,
      cells: {
        type: fruitTypeLabel(item.type, t),
        name: item.name.trim(),
        amount: `${round2(item.amount)} ${t(TREE_STOCK_UNIT_LABEL_KEY[item.unit] ?? 'farm.unit')}`,
      },
    })),
  };
}

export function livestockTable(data: FarmExportData, t: Translate): ExportTable {
  const names = farmNames(data);

  return {
    title: t('farm.livestock'),
    columns: [
      { key: 'type', label: t('export.type') },
      { key: 'name', label: t('farm.name') },
      { key: 'land', label: t('farm.land') },
      { key: 'count', label: t('farm.amount'), num: true },
    ],
    rows: data.livestock.map((group) => ({
      id: `herd-${group.id}`,
      cells: {
        type: livestockTypeLabel(group.type, t),
        name: group.name.trim(),
        land: names.get(group.farmId) ?? '',
        count: String(group.count),
      },
    })),
  };
}

export function greenhousesTable(data: FarmExportData, t: Translate): ExportTable {
  return {
    title: t('greenhouse.listTab'),
    columns: [
      { key: 'name', label: t('farm.name') },
      { key: 'area', label: t('farm.area'), num: true },
      { key: 'location', label: t('farm.location') },
    ],
    rows: data.greenhouses.map((house) => ({
      id: `greenhouse-${house.id}`,
      cells: {
        name: house.name,
        area: `${round2(house.area)} ${t('farm.areaUnit')}`,
        location: house.location,
      },
    })),
  };
}

export function equipmentTable(data: FarmExportData, t: Translate): ExportTable {
  return {
    title: t('equipment.title'),
    columns: [
      { key: 'name', label: t('farm.name') },
      { key: 'quantity', label: t('equipment.quantity'), num: true },
    ],
    rows: data.equipment.map((item) => ({
      id: `equipment-${item.id}`,
      cells: { name: item.name, quantity: String(item.quantity) },
    })),
  };
}
