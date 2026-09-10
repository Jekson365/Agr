export type SoilInvestigationStatus = 'Draft' | 'Completed' | 'Reviewed' | 'Archived';

export type SoilParameterGroup = 'FieldConditions' | 'Physical' | 'Chemical' | 'Nutrients' | 'AbsorbedBases';

export type SoilParameterValueKind = 'Numeric' | 'Category' | 'Text';

export type SoilNutrientForm = 'None' | 'Total' | 'Available';

export type SoilPointSelection = 'Minimum' | 'Midpoint' | 'Maximum' | 'Interpolate';

export type SoilScoringRuleSet = {
  id: number;
  name: string;
  source: string;
  version: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  maxScore: number;
  pointSelection: SoilPointSelection;
  notes: string;
};

export type SoilParameterDefinition = {
  id: number;
  key: string;
  group: SoilParameterGroup;
  valueKind: SoilParameterValueKind;
  defaultUnit: string;
  defaultUnitAvailable: string;
  supportsForms: boolean;
  sortOrder: number;
  isRegulationParameter: boolean;
};

export type SoilParameterCategory = {
  id: number;
  parameterId: number;
  key: string;
  sortOrder: number;
};

export type SoilFertilityFactor = {
  id: number;
  ruleSetId: number;
  key: string;
  minPoints: number;
  maxPoints: number;
  sortOrder: number;
  parameterId: number | null;
  form: SoilNutrientForm;
  isRequired: boolean;
};

export type SoilFertilityBand = {
  id: number;
  ruleSetId: number;
  key: string;
  minScore: number;
  maxScore: number;
  sortOrder: number;
};

export type SoilReferenceData = {
  ruleSet: SoilScoringRuleSet | null;
  parameters: SoilParameterDefinition[];
  categories: SoilParameterCategory[];
  factors: SoilFertilityFactor[];
  fertilityCategories: SoilFertilityBand[];
};

export type SoilInvestigation = {
  id: number;
  landPlotId: number;
  investigationDate: string;
  samplingDate: string | null;
  samplingDepthCm: number | null;
  laboratory: string;
  sampleNumber: string;
  status: SoilInvestigationStatus;
  notes: string;
  reportPath: string;
  createdAt: string;
};

export type SoilInvestigationResult = {
  id: number;
  soilInvestigationId: number;
  parameterId: number;
  form: SoilNutrientForm;
  numericValue: number | null;
  textValue: string;
  categoryId: number | null;
  unit: string;
};

export type SoilInvestigationDetail = {
  investigation: SoilInvestigation;
  results: SoilInvestigationResult[];
};

export type SoilFertilityAssessment = {
  id: number;
  landPlotId: number;
  soilInvestigationId: number;
  ruleSetId: number;
  score: number;
  maxScore: number;
  categoryId: number | null;
  isComplete: boolean;
  calculatedAt: string;
};

export type SoilFertilityAssessmentResult = {
  id: number;
  assessmentId: number;
  factorId: number;
  factorKey: string;
  inputValue: string;
  points: number | null;
  pointsMin: number;
  pointsMax: number;
  maximumPoints: number;
  hasData: boolean;
  explanation: string;
};

export type SoilFertilityAssessmentDetail = {
  assessment: SoilFertilityAssessment;
  results: SoilFertilityAssessmentResult[];
  limitations: string[];
  missingFactors: string[];
};

export type SoilInvestigationInput = Omit<SoilInvestigation, 'id' | 'createdAt'> & { id?: number };

export type SoilResultInput = Omit<SoilInvestigationResult, 'id' | 'soilInvestigationId'>;

export type SoilInvestigationDetailInput = {
  investigation: SoilInvestigationInput;
  results: SoilResultInput[];
};
