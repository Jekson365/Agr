import type { LivestockMovementSource } from '@/types/livestock-movement';

export const LIVESTOCK_MOVEMENT_SOURCE_LABEL_KEY: Record<LivestockMovementSource, string> = {
  Manual: 'livestockMovement.sourceManual',
  Birth: 'livestockMovement.sourceBirth',
  Gift: 'livestockMovement.sourceGift',
  Purchase: 'livestockMovement.sourcePurchase',
  Realization: 'livestockMovement.sourceRealization',
  Market: 'livestockMovement.sourceMarket',
};

export const LOCKED_MOVEMENT_SOURCES: readonly LivestockMovementSource[] = ['Realization', 'Market'];
