/**
 * Maps route patterns to page-guide translation keys (`help.<key>` in the locale files).
 * Checked in order; the first pattern that matches the current pathname wins, so static
 * segments (e.g. /farm/livestock/balance) must come before parameterized ones.
 */
export const PAGE_HELP: Array<{ pattern: string; key: string }> = [
  { pattern: '/main', key: 'dashboard' },
  { pattern: '/farm', key: 'farm' },
  { pattern: '/farm/land', key: 'land' },
  { pattern: '/farm/land/:id', key: 'landDetail' },
  { pattern: '/farm/livestock', key: 'livestock' },
  { pattern: '/farm/livestock/balance', key: 'livestockBalance' },
  { pattern: '/farm/livestock/:livestockId/production', key: 'livestockProduction' },
  { pattern: '/farm/livestock/:livestockId/animal/:stockId', key: 'animalHistory' },
  { pattern: '/farm/livestock/:id', key: 'livestockDetail' },
  { pattern: '/farm/stock', key: 'stock' },
  { pattern: '/farm/stock/balance', key: 'balance' },
  { pattern: '/farm/stock/:id', key: 'stockHistory' },
  { pattern: '/farm/fruits', key: 'fruits' },
  { pattern: '/farm/fruits/balance', key: 'balance' },
  { pattern: '/farm/fruits/:id', key: 'fruitsHistory' },
  { pattern: '/farm/greenhouse/balance', key: 'balance' },
  { pattern: '/farm/equipment', key: 'equipment' },
  { pattern: '/farm/types', key: 'kindTypes' },
  { pattern: '/harvest', key: 'harvest' },
  { pattern: '/harvest/detail/:id', key: 'harvestDetail' },
  { pattern: '/market', key: 'market' },
  { pattern: '/market/:id', key: 'marketDetail' },
  { pattern: '/report', key: 'report' },
  { pattern: '/report/harvest', key: 'reportHarvest' },
  { pattern: '/report/production', key: 'reportProduction' },
  { pattern: '/report/stock', key: 'reportStock' },
  { pattern: '/calendar', key: 'calendar' },
  { pattern: '/profile', key: 'profile' },
];
