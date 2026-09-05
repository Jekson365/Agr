import { apiFetch } from '@/services/api-client';
import type { HarvestAssessment, HarvestAssessmentSheet } from '@/types/harvest-assessment';

/** Every filter is optional: a harvest's whole sheet, one good's bands across all of them, or
 *  the lot. */
export function getHarvestAssessments(
  filter: { harvestId?: number; stockId?: number; treeStockId?: number } = {}
) {
  const query = Object.entries(filter)
    .filter(([, value]) => value != null)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  return apiFetch<HarvestAssessment[]>(`/api/harvestassessments${query ? `?${query}` : ''}`);
}

export function saveHarvestAssessmentSheet(sheet: HarvestAssessmentSheet) {
  return apiFetch<HarvestAssessment[]>('/api/harvestassessments', {
    method: 'PUT',
    body: JSON.stringify(sheet),
  });
}
