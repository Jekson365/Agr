import { apiFetch } from '@/services/api-client';
import type { GreenhouseSection, GreenhouseSectionInput } from '@/types/greenhouse-section';

export function getGreenhouseSections(greenhouseFloorId: number) {
  return apiFetch<GreenhouseSection[]>(`/api/greenhousesections?greenhouseFloorId=${greenhouseFloorId}`);
}

export function createGreenhouseSection(section: GreenhouseSectionInput) {
  return apiFetch<GreenhouseSection>('/api/greenhousesections', {
    method: 'POST',
    body: JSON.stringify(section),
  });
}

export function updateGreenhouseSection(id: number, section: GreenhouseSection) {
  return apiFetch<void>(`/api/greenhousesections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(section),
  });
}

export function deleteGreenhouseSection(id: number) {
  return apiFetch<void>(`/api/greenhousesections/${id}`, {
    method: 'DELETE',
  });
}
