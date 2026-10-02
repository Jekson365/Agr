import { apiFetch } from '@/services/api-client';
import type { VisitFilter, VisitInput, VisitSessionList, VisitSummary } from '@/types/visit';

function filterQuery(filter: VisitFilter, extra: Record<string, number> = {}): string {
  const params = new URLSearchParams({
    days: String(filter.days),
    includeBots: String(filter.includeBots),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  if (filter.search) params.set('search', filter.search);
  if (filter.visitorId) params.set('visitorId', filter.visitorId);
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  return params.toString();
}

export function recordVisit(visit: VisitInput): Promise<void> {
  return apiFetch<void>('/api/visits', { method: 'POST', body: JSON.stringify(visit) });
}

export function getVisitSummary(filter: VisitFilter): Promise<VisitSummary> {
  return apiFetch<VisitSummary>(`/api/admin/visits/summary?${filterQuery(filter)}`);
}

export function getVisitSessions(filter: VisitFilter, page: number, pageSize: number): Promise<VisitSessionList> {
  return apiFetch<VisitSessionList>(`/api/admin/visits/sessions?${filterQuery(filter, { page, pageSize })}`);
}
