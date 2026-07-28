import type { HarvestStatus } from '@/types/harvest';

export const HARVEST_STATUSES: HarvestStatus[] = ['Planning', 'Planting', 'Harvested'];

export const HARVEST_STATUS_LABEL_KEY: Record<HarvestStatus, string> = {
  Planning: 'harvest.statusPlanning',
  Planting: 'harvest.statusPlanting',
  Harvested: 'harvest.statusHarvested',
};

export const HARVEST_STATUS_BADGE_CLASS: Record<HarvestStatus, string> = {
  Planning: 'status-badge',
  Planting: 'status-badge status-badge-planting',
  Harvested: 'status-badge status-badge-harvested',
};
