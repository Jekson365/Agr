import type { NurseryStage, TreeSeedling } from '@/types/tree-seedling';

export const NURSERY_STAGES: NurseryStage[] = ['Sown', 'Sprouted', 'Hardening', 'Ready', 'PlantedOut'];

export const NURSERY_STAGE_LABEL_KEY: Record<NurseryStage, string> = {
  Sown: 'nursery.stageSown',
  Sprouted: 'nursery.stageSprouted',
  Hardening: 'nursery.stageHardening',
  Ready: 'nursery.stageReady',
  PlantedOut: 'nursery.stagePlantedOut',
};

export const NURSERY_STAGE_COLOR: Record<NurseryStage, string> = {
  Sown: 'var(--color-amber)',
  Sprouted: 'var(--color-stage-emergence)',
  Hardening: 'var(--color-stage-ripening)',
  Ready: 'var(--color-stage-ready)',
  PlantedOut: 'var(--color-green)',
};

/** The date each stage was reached, in stage order, so a card can read as a timeline. */
export function stageDate(seedling: TreeSeedling, stage: NurseryStage): string | null {
  if (stage === 'Sown') return seedling.sownDate;
  if (stage === 'Sprouted') return seedling.sproutedDate;
  if (stage === 'Hardening') return seedling.hardeningDate;
  if (stage === 'Ready') return seedling.readyDate;
  return seedling.plantedOutDate;
}

/** Whether the batch is out of the nursery. A planted-out batch is a record of what happened, so
 *  it takes no further edits — the trees it became are the orchard's now. */
export function isPlantedOut(stage: NurseryStage): boolean {
  return stage === 'PlantedOut';
}

/** The stage the batch may move to next. Batches go one way: a seed that has sprouted has
 *  sprouted, and planting out is its own action because it moves the orchard's tree count. */
export function nextStage(stage: NurseryStage): NurseryStage | null {
  const index = NURSERY_STAGES.indexOf(stage);
  const next = NURSERY_STAGES[index + 1];
  return next && next !== 'PlantedOut' ? next : null;
}
