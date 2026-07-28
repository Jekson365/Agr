import { apiFetch } from '@/services/api-client';
import type { MedicalRecord, MedicalRecordInput } from '@/types/medical-record';

export function getMedicalRecords(stockId: number) {
  return apiFetch<MedicalRecord[]>(`/api/medicalrecords?stockId=${stockId}`);
}

export function createMedicalRecord(input: MedicalRecordInput) {
  return apiFetch<MedicalRecord>('/api/medicalrecords', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteMedicalRecord(id: number) {
  return apiFetch<void>(`/api/medicalrecords/${id}`, {
    method: 'DELETE',
  });
}
