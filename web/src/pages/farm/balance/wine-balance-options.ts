import { bottleLotLabel, type BottleLot } from '@/pages/wine/wine-bottle-lots';
import type { BalanceAdjustOption } from '@/types/balance-adjustment';
import type { WineBatchSummary } from '@/types/wine';

export function wineAdjustOptions(
  batches: WineBatchSummary[],
  lots: BottleLot[],
  t: (key: string) => string
): BalanceAdjustOption[] {
  return batches
    .filter((batch) => !batch.isDeleted)
    .flatMap((batch): BalanceAdjustOption[] => [
      {
        key: `wine:${batch.id}`,
        title: batch.name,
        unitLabel: t('wine.unitLiter'),
        balance: batch.liters,
        target: { kind: 'wine', wineBatchId: batch.id },
      },
      ...lots
        .filter((lot) => lot.wineBatchId === batch.id)
        .map((lot): BalanceAdjustOption => ({
          key: `wineBottle:${lot.bottlingId}`,
          title: bottleLotLabel(lot, t, batch.name),
          unitLabel: t('wine.unitBottle'),
          balance: lot.left,
          target: { kind: 'wineBottle', wineBatchId: batch.id, wineBottlingId: lot.bottlingId },
        })),
    ]);
}
