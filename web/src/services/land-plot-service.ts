import { apiFetch } from '@/services/api-client';
import type { LandPlot, LandPlotInput } from '@/types/land-plot';

export function getLandPlots(farmId: number) {
  return apiFetch<LandPlot[]>(`/api/landplots?farmId=${farmId}`);
}

export function getLandPlot(id: number) {
  return apiFetch<LandPlot>(`/api/landplots/${id}`);
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
