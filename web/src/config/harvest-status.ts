import type { HarvestKind, HarvestStatus } from '@/types/harvest';

export const HARVEST_STATUSES: HarvestStatus[] = [
  'Planning',
  'Planting',
  'Emergence',
  'Flowering',
  'Ripening',
  'HarvestReady',
  'Harvested',
  'TransferredToBalance',
];

/**
 * The stages a greenhouse harvest offers. TransferredToBalance is deliberately absent: a
 * greenhouse books its yield at Harvested (see GreenhouseHarvestRepository), so offering the
 * step here would move a greenhouse off the status its own balances key on and reverse them.
 */
export const GREENHOUSE_HARVEST_STATUSES: HarvestStatus[] = HARVEST_STATUSES.filter(
  (status) => status !== 'TransferredToBalance'
);

const FRUIT_SKIPPED_STATUSES: HarvestStatus[] = ['Planting', 'Emergence'];

const FRUIT_HARVEST_STATUSES: HarvestStatus[] = HARVEST_STATUSES.filter(
  (status) => !FRUIT_SKIPPED_STATUSES.includes(status)
);

export function harvestStatusesFor(kind: HarvestKind, current?: HarvestStatus | null): HarvestStatus[] {
  if (kind !== 'Fruit') return HARVEST_STATUSES;
  if (current != null && FRUIT_SKIPPED_STATUSES.includes(current)) {
    return HARVEST_STATUSES.filter(
      (status) => !FRUIT_SKIPPED_STATUSES.includes(status) || status === current
    );
  }
  return FRUIT_HARVEST_STATUSES;
}

export const HARVEST_STATUS_LABEL_KEY: Record<HarvestStatus, string> = {
  Planning: 'harvest.statusPlanning',
  Planting: 'harvest.statusPlanting',
  Emergence: 'harvest.statusEmergence',
  Flowering: 'harvest.statusFlowering',
  Ripening: 'harvest.statusRipening',
  HarvestReady: 'harvest.statusHarvestReady',
  Harvested: 'harvest.statusHarvested',
  TransferredToBalance: 'harvest.statusTransferredToBalance',
};

export const HARVEST_STATUS_BADGE_CLASS: Record<HarvestStatus, string> = {
  Planning: 'status-badge',
  Planting: 'status-badge status-badge-planting',
  Emergence: 'status-badge status-badge-growing',
  Flowering: 'status-badge status-badge-growing',
  Ripening: 'status-badge status-badge-growing',
  HarvestReady: 'status-badge status-badge-ready',
  Harvested: 'status-badge status-badge-harvested',
  TransferredToBalance: 'status-badge status-badge-balanced',
};

export const HARVEST_STATUS_COLOR: Record<HarvestStatus, string> = {
  Planning: 'var(--color-amber)',
  Planting: 'var(--color-blue)',
  Emergence: 'var(--color-stage-emergence)',
  Flowering: 'var(--color-stage-flowering)',
  Ripening: 'var(--color-stage-ripening)',
  HarvestReady: 'var(--color-stage-ready)',
  Harvested: 'var(--color-green)',
  TransferredToBalance: 'var(--color-stage-balanced)',
};
