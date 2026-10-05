import { apiFetch } from '@/services/api-client';
import type { WineMeasurement } from '@/types/wine';

export function getWineMeasurements(wineBatchId: number) {
  return apiFetch<WineMeasurement[]>(`/api/winemeasurements?wineBatchId=${wineBatchId}`);
}

export function createWineMeasurement(measurement: Omit<WineMeasurement, 'id'>) {
  return apiFetch<WineMeasurement>('/api/winemeasurements', {
    method: 'POST',
    body: JSON.stringify(measurement),
  });
}

export function updateWineMeasurement(measurement: WineMeasurement) {
  return apiFetch<void>(`/api/winemeasurements/${measurement.id}`, {
    method: 'PUT',
    body: JSON.stringify(measurement),
  });
}

export function deleteWineMeasurement(id: number) {
  return apiFetch<void>(`/api/winemeasurements/${id}`, { method: 'DELETE' });
}
