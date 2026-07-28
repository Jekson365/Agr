import { apiFetch } from '@/services/api-client';
import type { PlantScanHistoryEntry } from '@/types/plant-scan-history';

export function getPlantScanHistory() {
  return apiFetch<PlantScanHistoryEntry[]>('/api/plantscanhistory');
}

export function deletePlantScanHistoryEntry(id: number) {
  return apiFetch<void>(`/api/plantscanhistory/${id}`, {
    method: 'DELETE',
  });
}
