export type HarvestActivity = 'Irrigation' | 'Fertilization' | 'CropProtection' | 'Inspection';

export const HARVEST_ACTIVITIES: HarvestActivity[] = [
  'Irrigation',
  'Fertilization',
  'CropProtection',
  'Inspection',
];

const HARVEST_ACTIVITY_LABEL_KEY: Record<HarvestActivity, string> = {
  Irrigation: 'harvestTimeline.activityIrrigation',
  Fertilization: 'harvestTimeline.activityFertilization',
  CropProtection: 'harvestTimeline.activityCropProtection',
  Inspection: 'harvestTimeline.activityInspection',
};

export function harvestActivityLabel(value: string, t: (key: string) => string): string {
  const key = HARVEST_ACTIVITY_LABEL_KEY[value as HarvestActivity];
  return key ? t(key) : value;
}
