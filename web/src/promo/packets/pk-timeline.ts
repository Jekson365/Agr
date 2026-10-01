export const PACKETS_DURATION = 10;
export const PACKETS_OUTRO = 8;

export const CARDS_IN = [0.45, 0.6, 0.75];
export const PRICE_DELAY = 0.3;
export const ROWS_DELAY = 0.4;
export const ROW_STEP = 0.08;
export const BADGE_AT = 1.9;

export const FOCUS = [
  { from: 3.2, to: 4.8 },
  { from: 4.8, to: 6.4 },
  { from: 6.4, to: PACKETS_DURATION },
];

export const CAPTION_STARTS = [0.15, ...FOCUS.map((span) => span.from)];

export const CARDS_BOX = { x: 160, y: 335, width: 1600 };
export const CARD_ZOOM = 1.95;

export function focusIndex(time: number): { index: number; since: number } | null {
  const found = FOCUS.findIndex((span) => time >= span.from && time < span.to);
  return found === -1 ? null : { index: found, since: FOCUS[found].from };
}
