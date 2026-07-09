import { apiFetch } from '@/services/api-client';
import type { StockMovementReportRow } from '@/types/report';

/** The /farm/balance report: every plant-stock and fruit-tree-stock movement joined with its
 * product, grouped by product with the newest movement first within each group. */
export function getStockMovementReport() {
  return apiFetch<StockMovementReportRow[]>('/api/reports/stock-movements');
}
