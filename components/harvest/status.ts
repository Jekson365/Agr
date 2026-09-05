import { styles } from '@/components/farm/shared/styles';
import type { HarvestStatus } from '@/types/harvest';

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

export const HARVEST_STATUS_BADGE_STYLE: Record<HarvestStatus, object | undefined> = {
  Planning: undefined,
  Planting: styles.statusBadgePlanting,
  Emergence: styles.statusBadgePlanting,
  Flowering: styles.statusBadgePlanting,
  Ripening: styles.statusBadgePlanting,
  HarvestReady: styles.statusBadgePlanting,
  Harvested: styles.statusBadgeHarvested,
  TransferredToBalance: styles.statusBadgeBalanced,
};

export const HARVEST_STATUS_BADGE_TEXT_STYLE: Record<HarvestStatus, object | undefined> = {
  Planning: undefined,
  Planting: styles.statusBadgePlantingText,
  Emergence: styles.statusBadgePlantingText,
  Flowering: styles.statusBadgePlantingText,
  Ripening: styles.statusBadgePlantingText,
  HarvestReady: styles.statusBadgePlantingText,
  Harvested: styles.statusBadgeHarvestedText,
  TransferredToBalance: styles.statusBadgeBalancedText,
};
