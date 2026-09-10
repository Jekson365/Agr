import { apiFetch, uploadImage } from '@/services/api-client';
import type {
  SoilFertilityAssessment,
  SoilFertilityAssessmentDetail,
  SoilInvestigation,
  SoilInvestigationDetail,
  SoilInvestigationDetailInput,
  SoilReferenceData,
} from '@/types/soil';

export function getSoilReference() {
  return apiFetch<SoilReferenceData>('/api/soilfertility/reference');
}

export function getSoilInvestigations(landPlotId: number) {
  return apiFetch<SoilInvestigation[]>(`/api/soilinvestigations?landPlotId=${landPlotId}`);
}

export function getSoilInvestigation(id: number) {
  return apiFetch<SoilInvestigationDetail>(`/api/soilinvestigations/${id}`);
}

export function createSoilInvestigation(detail: SoilInvestigationDetailInput) {
  return apiFetch<SoilInvestigationDetail>('/api/soilinvestigations', {
    method: 'POST',
    body: JSON.stringify(detail),
  });
}

export function updateSoilInvestigation(id: number, detail: SoilInvestigationDetailInput) {
  return apiFetch<SoilInvestigationDetail>(`/api/soilinvestigations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(detail),
  });
}

export function deleteSoilInvestigation(id: number) {
  return apiFetch<void>(`/api/soilinvestigations/${id}`, { method: 'DELETE' });
}

export function getSoilAssessment(investigationId: number) {
  return apiFetch<SoilFertilityAssessmentDetail>(`/api/soilfertility/assessment/${investigationId}`);
}

export function calculateSoilAssessment(investigationId: number) {
  return apiFetch<SoilFertilityAssessmentDetail>(`/api/soilfertility/assessment/${investigationId}`, {
    method: 'POST',
  });
}

export function getSoilFertilityHistory(landPlotId: number) {
  return apiFetch<SoilFertilityAssessment[]>(`/api/soilfertility/history?landPlotId=${landPlotId}`);
}

export function uploadSoilReport(file: File) {
  return uploadImage(file, '/api/soilinvestigations/upload-report');
}
