import type { HarvestStatus } from '@/types/harvest';
import { easeInOut, enter } from '@/promo/motion';

export const CYCLE_DURATION = 20;
export const CYCLE_OUTRO = 18;

export const CYCLE_WINDOW = { x: 160, y: 262, width: 1600, height: 790 };
export const CYCLE_WINDOW_IN = 0.35;
export const PAGE_ZOOM = 0.92;

export const CAPTION_STARTS = [0.15, 1.7, 4.1, 8.05, 9.6, 11.7, 13.75, 15.6];

export const CLICK = {
  add: 2.2,
  seed: 4.45,
  planting: 5.2,
  emergence: 5.8,
  flowering: 6.35,
  ripening: 6.9,
  ready: 7.45,
  harvested: 8.3,
  overview: 9.8,
  grading: 11.95,
  chemicals: 14.0,
  balance: 16.1,
};

export const CLICK_TIMES = Object.values(CLICK);

export const NEW_ROW_AT = CLICK.add + 0.1;
export const SEED_ROW_AT = CLICK.seed + 0.1;
export const HARVESTED_AT = CLICK.harvested + 0.05;
export const STOCK_AT = CLICK.balance + 0.15;
export const CURSOR_IN = 1.55;
export const CURSOR_OUT = CYCLE_OUTRO - 0.45;

export const SCROLL_DISTANCE = 300;
const SCROLL_DOWN = CLICK.overview + 0.12;
const SCROLL_UP = CLICK.balance - 0.7;

export function scrollOffset(time: number): number {
  return SCROLL_DISTANCE * (enter(time, SCROLL_DOWN, 0.6, easeInOut) - enter(time, SCROLL_UP, 0.5, easeInOut));
}

export type ResultTab = 'result' | 'overview' | 'grading' | 'chemicals';

export function resultTab(time: number): { tab: ResultTab; since: number } {
  if (time >= CLICK.chemicals + 0.04) return { tab: 'chemicals', since: CLICK.chemicals + 0.04 };
  if (time >= CLICK.grading + 0.04) return { tab: 'grading', since: CLICK.grading + 0.04 };
  if (time >= CLICK.overview + 0.04) return { tab: 'overview', since: CLICK.overview + 0.04 };
  return { tab: 'result', since: HARVESTED_AT };
}

export function pressNear(time: number, at: number): number {
  return Math.max(0, 1 - Math.abs(time - at) / 0.12);
}

const STATUS_CHANGES: [number, HarvestStatus][] = [
  [CLICK.planting, 'Planting'],
  [CLICK.emergence, 'Emergence'],
  [CLICK.flowering, 'Flowering'],
  [CLICK.ripening, 'Ripening'],
  [CLICK.ready, 'HarvestReady'],
  [CLICK.harvested, 'Harvested'],
  [CLICK.balance, 'TransferredToBalance'],
];

export function tomatoStatus(time: number): { status: HarvestStatus; since: number } {
  let current: { status: HarvestStatus; since: number } = { status: 'Planning', since: NEW_ROW_AT };
  for (const [at, status] of STATUS_CHANGES) {
    if (time >= at + 0.04) current = { status, since: at + 0.04 };
  }
  return current;
}

export const TOMATO_STAGE_DATES = [
  '2026-04-10',
  '2026-04-14',
  '2026-04-29',
  '2026-06-02',
  '2026-07-10',
  '2026-08-12',
  '2026-08-18',
  '2026-08-20',
];

export const CUCUMBER_STAGE_DATES = ['2026-08-01', '2026-08-01', '2026-08-12', '2026-09-20'];

export const TOMATO = {
  date: '2026-04-10',
  expected: '2026-08-20',
  dueDays: 132,
  seedKg: 2,
  yieldKg: 1340,
  revenue: 5600,
  cost: 3095,
};

export const CUCUMBER = {
  date: '2026-08-01',
  expected: '2026-10-25',
  dueDays: 24,
  seedKg: 1,
};
