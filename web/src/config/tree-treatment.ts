export type TreeTreatmentType =
  | 'Spraying'
  | 'Pruning'
  | 'Fertilization'
  | 'Irrigation'
  | 'Weeding'
  | 'SoilLoosening'
  | 'Mulching'
  | 'Thinning'
  | 'Grafting'
  | 'Whitewashing'
  | 'FrostProtection'
  | 'Inspection';

export const TREE_TREATMENTS: TreeTreatmentType[] = [
  'Spraying',
  'Pruning',
  'Fertilization',
  'Irrigation',
  'Weeding',
  'SoilLoosening',
  'Mulching',
  'Thinning',
  'Grafting',
  'Whitewashing',
  'FrostProtection',
  'Inspection',
];

const TREE_TREATMENT_LABEL_KEY: Record<TreeTreatmentType, string> = {
  Spraying: 'treatment.typeSpraying',
  Pruning: 'treatment.typePruning',
  Fertilization: 'treatment.typeFertilization',
  Irrigation: 'treatment.typeIrrigation',
  Weeding: 'treatment.typeWeeding',
  SoilLoosening: 'treatment.typeSoilLoosening',
  Mulching: 'treatment.typeMulching',
  Thinning: 'treatment.typeThinning',
  Grafting: 'treatment.typeGrafting',
  Whitewashing: 'treatment.typeWhitewashing',
  FrostProtection: 'treatment.typeFrostProtection',
  Inspection: 'treatment.typeInspection',
};

const TREE_TREATMENT_COLOUR: Record<TreeTreatmentType, string> = {
  Spraying: 'var(--color-violet)',
  Pruning: 'var(--color-amber)',
  Fertilization: 'var(--color-stage-emergence)',
  Irrigation: 'var(--color-blue)',
  Weeding: 'var(--color-green)',
  SoilLoosening: 'var(--color-gold)',
  Mulching: 'var(--color-dark)',
  Thinning: 'var(--color-stage-ripening)',
  Grafting: 'var(--color-stage-flowering)',
  Whitewashing: 'var(--color-stage-ready)',
  FrostProtection: 'var(--color-stage-fruit)',
  Inspection: 'var(--color-muted)',
};

export function treeTreatmentLabel(value: string, t: (key: string) => string): string {
  const key = TREE_TREATMENT_LABEL_KEY[value as TreeTreatmentType];
  return key ? t(key) : value;
}

export function treeTreatmentColour(value: string): string {
  return TREE_TREATMENT_COLOUR[value as TreeTreatmentType] ?? 'var(--color-muted)';
}
