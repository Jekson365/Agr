import { createHarvestItem, deleteHarvestItem, updateHarvestItem } from '@/services/harvest-item-service';
import type { HarvestItem } from '@/types/harvest-item';

export async function saveWinePlan(
  harvestId: number,
  stockId: number,
  current: HarvestItem | undefined,
  amount: number
): Promise<HarvestItem[]> {
  if (current && amount === 0) {
    await deleteHarvestItem(current.id);
    return [];
  }
  if (current) {
    const updated: HarvestItem = { ...current, stockId, treeStockId: null, amount, unit: 'Kilogram' };
    await updateHarvestItem(current.id, updated);
    return [updated];
  }
  if (amount === 0) return [];
  return [await createHarvestItem({ harvestId, stockId, treeStockId: null, amount, unit: 'Kilogram' })];
}
