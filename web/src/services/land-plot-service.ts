import { apiFetch } from '@/services/api-client';
import type { LandPlot, LandPlotInput } from '@/types/land-plot';

export function getLandPlots(farmId: number) {
  return apiFetch<LandPlot[]>(`/api/landplots?farmId=${farmId}`);
}

/** Every plot on the farm. The land list draws each card's contents from these, so it reads them
 *  once rather than once per piece of land. */
export function getAllLandPlots() {
  return apiFetch<LandPlot[]>('/api/landplots');
}

export function getLandPlot(id: number) {
  return apiFetch<LandPlot>(`/api/landplots/${id}`);
}

/** The fruit entries a plot already grows: on one piece of land, which is where a fruit may only
 *  be planted once, or — with no `farmId` — on any land at all. */
export function getUsedTreeStockIds(farmId?: number) {
  const query = farmId == null ? '' : `?farmId=${farmId}`;
  return apiFetch<number[]>(`/api/landplots/used-tree-stocks${query}`);
}

/** The stock goods a plot already grows — the `getUsedTreeStockIds` counterpart, scoped the
 *  same way. */
export function getUsedStockIds(farmId?: number) {
  const query = farmId == null ? '' : `?farmId=${farmId}`;
  return apiFetch<number[]>(`/api/landplots/used-stocks${query}`);
}

export function createLandPlot(plot: LandPlotInput) {
  return apiFetch<LandPlot>('/api/landplots', {
    method: 'POST',
    body: JSON.stringify(plot),
  });
}

export function updateLandPlot(id: number, plot: LandPlot) {
  return apiFetch<void>(`/api/landplots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(plot),
  });
}

export function deleteLandPlot(id: number) {
  return apiFetch<void>(`/api/landplots/${id}`, {
    method: 'DELETE',
  });
}
