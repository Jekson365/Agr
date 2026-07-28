/**
 * A per-tenant switch. Stored as a name/value pair, so a new setting is a seeded row rather than a
 * schema change — the profile lists whatever the server sends without knowing the names.
 */
export type Configuration = {
  id: number;
  name: string;
  /** Today every setting is a 0/1 flag. */
  value: number;
};

/** The setting that reveals the greenhouse area. */
export const GREENHOUSE_CONFIG = 'greenhouse';

/**
 * The setting that reveals crop farming — the field's harvests, its seed and its plant stock.
 * Cased as the server seeds it; the older settings are lowercase.
 */
export const CROP_FARMING_CONFIG = 'CropFarming';

/** The setting that reveals livestock: the herds, their animals and what they produce. */
export const LIVESTOCK_CONFIG = 'livestock';

/** The setting that reveals the orchard — fruit trees, their harvests and their produce. */
export const FRUIT_STOCK_CONFIG = 'fruitstock';

/** The setting that reveals the marketplace — browsing listings and one's own. */
export const MARKETPLACE_CONFIG = 'marketplace';

/** The setting that reveals the calendar. */
export const CALENDAR_CONFIG = 'calendar';
