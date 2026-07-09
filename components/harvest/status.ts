import { styles } from '@/components/farm/shared/styles';
import type { HarvestStatus } from '@/types/harvest';

export const HARVEST_STATUSES: HarvestStatus[] = ['Planning', 'Planting', 'Harvested'];

export const HARVEST_STATUS_LABEL_KEY: Record<HarvestStatus, string> = {
  Planning: 'harvest.statusPlanning',
  Planting: 'harvest.statusPlanting',
  Harvested: 'harvest.statusHarvested',
};

export const HARVEST_STATUS_BADGE_STYLE: Record<HarvestStatus, object | undefined> = {
  Planning: undefined,
  Planting: styles.statusBadgePlanting,
  Harvested: styles.statusBadgeHarvested,
};

export const HARVEST_STATUS_BADGE_TEXT_STYLE: Record<HarvestStatus, object | undefined> = {
  Planning: undefined,
  Planting: styles.statusBadgePlantingText,
  Harvested: styles.statusBadgeHarvestedText,
};
