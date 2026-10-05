import { getWineBottlings } from '@/services/wine-bottling-service';
import { getWineMovements } from '@/services/wine-movement-service';

export type BottleLot = {
  bottlingId: number;
  wineBatchId: number;
  size: number;
  lot: string | null;
  left: number;
};

export async function loadBottleLots(wineBatchId?: number): Promise<BottleLot[]> {
  const [bottlings, movements] = await Promise.all([getWineBottlings(wineBatchId), getWineMovements(wineBatchId)]);

  const left = new Map<number, number>();
  for (const movement of movements) {
    if (movement.wineBottlingId == null) continue;
    left.set(movement.wineBottlingId, (left.get(movement.wineBottlingId) ?? 0) + movement.bottleDelta);
  }

  return bottlings.map((bottling) => ({
    bottlingId: bottling.id,
    wineBatchId: bottling.wineBatchId,
    size: bottling.bottleSize,
    lot: bottling.lot,
    left: left.get(bottling.id) ?? 0,
  }));
}

export function bottleLotLabel(lot: BottleLot, t: (key: string) => string, batchName?: string): string {
  return [batchName, `${lot.size} ${t('wine.unitLiter')}`, lot.lot ? `${t('wine.lotShort')} ${lot.lot}` : null]
    .filter(Boolean)
    .join(' · ');
}
