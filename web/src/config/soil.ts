import type {
  SoilInvestigationStatus,
  SoilNutrientForm,
  SoilParameterDefinition,
  SoilParameterGroup,
  SoilReferenceData,
} from '@/types/soil';

export const SOIL_GROUP_ORDER: SoilParameterGroup[] = [
  'FieldConditions',
  'Physical',
  'Chemical',
  'Nutrients',
  'AbsorbedBases',
];

export const SOIL_GROUP_LABEL_KEY: Record<SoilParameterGroup, string> = {
  FieldConditions: 'soil.groupFieldConditions',
  Physical: 'soil.groupPhysical',
  Chemical: 'soil.groupChemical',
  Nutrients: 'soil.groupNutrients',
  AbsorbedBases: 'soil.groupAbsorbedBases',
};

export const SOIL_GROUP_TAB_LABEL_KEY: Record<SoilParameterGroup, string> = {
  FieldConditions: 'soil.tabFieldConditions',
  Physical: 'soil.tabPhysical',
  Chemical: 'soil.tabChemical',
  Nutrients: 'soil.tabNutrients',
  AbsorbedBases: 'soil.tabAbsorbedBases',
};

export const SOIL_STATUS_OPTIONS: { value: SoilInvestigationStatus; labelKey: string }[] = [
  { value: 'Draft', labelKey: 'soil.statusDraft' },
  { value: 'Completed', labelKey: 'soil.statusCompleted' },
  { value: 'Reviewed', labelKey: 'soil.statusReviewed' },
  { value: 'Archived', labelKey: 'soil.statusArchived' },
];

export const SOIL_FORM_OPTIONS: { value: SoilNutrientForm; labelKey: string }[] = [
  { value: 'Total', labelKey: 'soil.formTotal' },
  { value: 'Available', labelKey: 'soil.formAvailable' },
];

export function soilParameterLabel(key: string, t: (key: string) => string): string {
  const translated = t(`soil.param.${key}`);
  return translated === `soil.param.${key}` ? key : translated;
}

export function soilCategoryLabel(key: string, t: (key: string) => string): string {
  const translated = t(`soil.category.${key}`);
  return translated === `soil.category.${key}` ? key : translated;
}

export function soilFactorLabel(key: string, t: (key: string) => string): string {
  const translated = t(`soil.factor.${key}`);
  return translated === `soil.factor.${key}` ? key : translated;
}

export function soilBandLabel(key: string, t: (key: string) => string): string {
  const translated = t(`soil.band.${key}`);
  return translated === `soil.band.${key}` ? key : translated;
}

export function bandClassFor(key: string): string {
  return `soil-band-${key.toLowerCase()}`;
}

export function unitFor(parameter: SoilParameterDefinition, form: SoilNutrientForm): string {
  return form === 'Available' && parameter.defaultUnitAvailable
    ? parameter.defaultUnitAvailable
    : parameter.defaultUnit;
}

export function formsFor(supportsForms: boolean): SoilNutrientForm[] {
  return supportsForms ? ['Total', 'Available'] : ['None'];
}

export function categoriesFor(reference: SoilReferenceData, parameterId: number) {
  return reference.categories
    .filter((category) => category.parameterId === parameterId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function parametersIn(reference: SoilReferenceData, group: SoilParameterGroup) {
  return reference.parameters
    .filter((parameter) => parameter.group === group)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function bandFor(reference: SoilReferenceData, categoryId: number | null) {
  return categoryId == null ? null : reference.fertilityCategories.find((band) => band.id === categoryId) ?? null;
}
