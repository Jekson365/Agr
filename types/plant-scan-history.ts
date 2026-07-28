import type { PlantScanSeverity } from '@/types/plant-scan';

export type PlantScanHistoryEntry = {
  id: number;
  imagePath: string;
  plantDetected: boolean;
  plantName: string;
  isHealthy: boolean;
  diseaseName: string;
  severity: PlantScanSeverity;
  confidence: number;
  summary: string;
  symptoms: string[];
  treatments: string[];
  preventionTips: string[];
  createdAt: string;
};
