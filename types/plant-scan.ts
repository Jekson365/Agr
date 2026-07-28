export type PlantScanSeverity = 'None' | 'Low' | 'Medium' | 'High';

export type PlantScanResult = {
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
};
