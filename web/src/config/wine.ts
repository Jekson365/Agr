import type { WineMovementSource, WineOperationKind, WineStage } from '@/types/wine';

export const LITERS_PER_KG = 0.65;

export const WINE_CELLAR_PATH = '/farm/wine/cellar';

export const WINE_BOTTLES_PATH = '/farm/wine/bottles';

export function wineBatchPath(id: number): string {
  return `${WINE_CELLAR_PATH}/${id}`;
}

export const WINE_STAGES: WineStage[] = ['Fermenting', 'Bottled', 'Stocked'];

export const WINE_STAGE_LABEL_KEY: Record<WineStage, string> = {
  Fermenting: 'wine.stageFermenting',
  Aging: 'wine.stageAging',
  Bottled: 'wine.stageBottled',
  Stocked: 'wine.stageStocked',
};

export const WINE_SOURCE_LABEL_KEY: Record<WineMovementSource, string> = {
  Production: 'wine.sourceProduction',
  Bottling: 'wine.sourceBottling',
  Loss: 'wine.sourceLoss',
  Manual: 'wine.sourceManual',
  Market: 'wine.sourceMarket',
};

export const WINE_OPERATION_KINDS: WineOperationKind[] = ['PunchDown', 'Racking', 'ToppingUp', 'Additive', 'Filtration', 'Other'];

export const WINE_OPERATION_LABEL_KEY: Record<WineOperationKind, string> = {
  PunchDown: 'wine.opPunchDown',
  Racking: 'wine.opRacking',
  ToppingUp: 'wine.opToppingUp',
  Additive: 'wine.opAdditive',
  Filtration: 'wine.opFiltration',
  Other: 'wine.opOther',
};

export function parseAmount(value: string | undefined): number {
  return Math.max(0, parseFloat(value ?? '') || 0);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
