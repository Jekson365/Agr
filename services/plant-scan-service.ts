import { buildImageFormData, postImageFormData } from '@/services/api-client';
import type { Language } from '@/contexts/language-context';
import type { PlantScanResult } from '@/types/plant-scan';

export async function analyzePlantImage(uri: string, language: Language): Promise<PlantScanResult> {
  const formData = await buildImageFormData(uri);
  formData.append('language', language);
  return postImageFormData<PlantScanResult>('/api/plantscan/analyze', formData);
}
