import { apiFetch } from '@/services/api-client';
import type { AssessmentCriteria, AssessmentCriteriaSheet } from '@/types/assessment-criteria';

export function getAssessmentCriteria(good: { stockId?: number; treeStockId?: number }) {
  const query = good.stockId != null ? `stockId=${good.stockId}` : `treeStockId=${good.treeStockId}`;
  return apiFetch<AssessmentCriteria[]>(`/api/assessmentcriteria?${query}`);
}

export function saveAssessmentCriteria(sheet: AssessmentCriteriaSheet) {
  return apiFetch<AssessmentCriteria[]>('/api/assessmentcriteria', {
    method: 'PUT',
    body: JSON.stringify(sheet),
  });
}
