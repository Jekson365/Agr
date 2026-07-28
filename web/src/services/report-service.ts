import { apiFetch } from '@/services/api-client';
import type {
  ReportCategory,
  ReportDayDetails,
  ReportOverview,
  ReportPeriodQuery,
  ReportSeriesDetails,
  StockMovementReportRow,
} from '@/types/report';

/** The /farm/balance report: every plant-stock and fruit-tree-stock movement joined with its
 * product, grouped by product. */
export function getStockMovementReport() {
  return apiFetch<StockMovementReportRow[]>('/api/reports/stock-movements');
}

/** The period as query params. Only the fields the chosen mode actually uses are sent, so an
 * unrelated leftover (a stale custom range behind a year filter) can't reach the aggregation. */
function periodParams(period: ReportPeriodQuery): Record<string, string> {
  const params: Record<string, string> = { 'period.mode': period.mode };
  if (period.mode === 'year' || period.mode === 'quarter') {
    if (period.year != null) params['period.year'] = String(period.year);
  }
  if (period.mode === 'quarter' && period.quarter != null) {
    params['period.quarter'] = String(period.quarter);
  }
  if (period.mode === 'custom') {
    if (period.from) params['period.from'] = period.from;
    if (period.to) params['period.to'] = period.to;
  }
  return params;
}

function query(params: Record<string, string>): string {
  return new URLSearchParams(params).toString();
}

/** Cells 1 and 2 of /report — the value-over-time columns and the per-series groups, totalled
 * server-side for this category and period. */
export function getReportOverview(category: ReportCategory, period: ReportPeriodQuery) {
  return apiFetch<ReportOverview>(`/api/reports/overview?${query({ category, ...periodParams(period) })}`);
}

/** Cell 3 — what the day behind a clicked value bar contains. */
export function getReportDay(category: ReportCategory, day: string) {
  return apiFetch<ReportDayDetails>(`/api/reports/day?${query({ category, day })}`);
}

/** Cell 4 — every record behind the series whose bar was clicked. */
export function getReportSeries(category: ReportCategory, period: ReportPeriodQuery, key: string) {
  return apiFetch<ReportSeriesDetails>(`/api/reports/series?${query({ category, key, ...periodParams(period) })}`);
}
