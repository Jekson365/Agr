import qvevriIcon from '@/assets/icons/qvevri.svg';
import equipmentIcon from '@/assets/properties/equipment.png';
import { SEED_UNIT_LABEL_KEY } from '@/config/seed-kinds';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { WINE_STAGE_LABEL_KEY } from '@/config/wine';
import { resolveAssetUrl } from '@/services/api-client';
import type { AdminStock } from '@/types/admin';
import type { AdminEquipment, AdminSeed, AdminWineBatch } from '@/types/admin-details';
import { formatAmount } from './user-detail-format';
import type { DetailItem } from './user-detail-section';

type Translate = (key: string) => string;

export function stockItems(stocks: AdminStock[], t: Translate): DetailItem[] {
  return stocks.map((stock) => ({
    key: `stock-${stock.id}`,
    image: stockKindImage(stock.type),
    title: stockTypeLabel(stock.type, t),
    subtitle: stock.name,
    value: `${formatAmount(stock.amount)} ${t(STOCK_UNIT_LABEL_KEY[stock.unit] ?? stock.unit)}`,
    removed: stock.isDeleted,
  }));
}

export function seedItems(seeds: AdminSeed[], t: Translate): DetailItem[] {
  return seeds.map((seed) => ({
    key: `seed-${seed.id}`,
    image: stockKindImage(seed.type),
    title: stockTypeLabel(seed.type, t),
    subtitle: seed.name,
    value: `${formatAmount(seed.amount)} ${t(SEED_UNIT_LABEL_KEY[seed.unit] ?? seed.unit)}`,
    removed: seed.isDeleted,
  }));
}

export function equipmentItems(equipment: AdminEquipment[], t: Translate): DetailItem[] {
  return equipment.map((item) => ({
    key: `equipment-${item.id}`,
    image: item.imagePath ? resolveAssetUrl(item.imagePath) : equipmentIcon,
    title: item.name,
    subtitle: '',
    value: `${item.quantity} ${t('farm.unitQuantity')}`,
    removed: false,
  }));
}

export function wineBatchItems(batches: AdminWineBatch[], t: Translate): DetailItem[] {
  return batches.map((batch) => ({
    key: `batch-${batch.id}`,
    image: qvevriIcon,
    title: batch.name,
    subtitle: `${batch.vintage} · ${t(WINE_STAGE_LABEL_KEY[batch.stage] ?? batch.stage)}`,
    value: `${formatAmount(batch.liters)} ${t('wine.unitLiter')} · ${batch.bottles} ${t('wine.unitBottle')}`,
    removed: batch.isDeleted,
  }));
}
