/**
 * Display names for the settings the server stores. Keyed by the stored name, exactly like the
 * stock and production catalogs — a setting without an entry here falls back to its raw name, so
 * a newly seeded one still lists on the profile without a code change.
 */
export const CONFIGURATION_LABEL_KEY: Record<string, string> = {
  greenhouse: 'farm.greenhouse',
  CropFarming: 'dashboard.plantFarming',
  livestock: 'farm.livestock',
  fruitstock: 'farm.fruits',
  marketplace: 'dashboard.marketplace',
  calendar: 'dashboard.calendar',
};
