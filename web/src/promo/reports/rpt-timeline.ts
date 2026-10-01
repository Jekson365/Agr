export const REPORTS_DURATION = 18;
export const REPORTS_OUTRO = 16;
export const WINDOW_IN = 0.35;
export const SIDEBAR_WIDTH = 240;
export const HARVEST_ZOOM = 1;
export const REPORT_ZOOM = 1.22;

export const CLICK = {
  transfer: 2.7,
  balance: 4.3,
  report: 7.2,
  harvestReport: 10.1,
  stockReport: 12.9,
};

export const CAPTION_STARTS = [0.15, 1.7, 4.2, 7.1, 10.0, 12.8];
export const CURSOR_IN = 1.6;
export const CURSOR_OUT = REPORTS_OUTRO - 0.45;

export type PageId = 'harvest' | 'balance' | 'report' | 'harvestReport' | 'stockReport';

const PAGE_CHANGES: [number, PageId][] = [
  [CLICK.balance, 'balance'],
  [CLICK.report, 'report'],
  [CLICK.harvestReport, 'harvestReport'],
  [CLICK.stockReport, 'stockReport'],
];

export function currentPage(time: number): { page: PageId; since: number } {
  let current: { page: PageId; since: number } = { page: 'harvest', since: WINDOW_IN };
  for (const [at, page] of PAGE_CHANGES) {
    if (time >= at + 0.05) current = { page, since: at + 0.05 };
  }
  return current;
}

export const ADDRESS: Record<PageId, string> = {
  harvest: 'mtabari.com.ge/harvest',
  balance: 'mtabari.com.ge/farm/stock/balance',
  report: 'mtabari.com.ge/report',
  harvestReport: 'mtabari.com.ge/report/harvest',
  stockReport: 'mtabari.com.ge/report/stock',
};

export const TOMATO = { yieldKg: 1340, revenue: 5600, cost: 2700 };
