export const WINERY_DURATION = 15;
export const WINERY_OUTRO = 13;

export const BEAT = {
  brand: 0.1,
  eyebrow: 0.35,
  title: 0.55,
  card: 1.3,
  tiles: 1.6,
  sticker: 1.95,
  mascot: 2.35,
  cta: 2.6,
  shine: 12,
};

export const STEP_AT = [2.7, 5.2, 7.7, 10.2];

export function stepIndex(time: number): number {
  return STEP_AT.reduce((found, at, index) => (time >= at ? index : found), -1);
}

export const WINE = {
  grapeKg: 1200,
  liters: 780,
  bottles: 1040,
  sold: 450,
  revenue: 9000,
  costs: 2200,
};
