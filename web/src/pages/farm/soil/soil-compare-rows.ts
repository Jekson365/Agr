import { soilCategoryLabel, soilParameterLabel } from '@/config/soil';
import type {
  SoilFertilityAssessmentDetail,
  SoilInvestigationDetail,
  SoilNutrientForm,
  SoilReferenceData,
} from '@/types/soil';

export type CompareRow = { key: string; label: string; left: string; right: string; changed: boolean };

type Translate = (key: string) => string;

function valueText(
  detail: SoilInvestigationDetail,
  parameterId: number,
  form: SoilNutrientForm,
  reference: SoilReferenceData,
  t: Translate
): string {
  const row = detail.results.find((r) => r.parameterId === parameterId && r.form === form);
  if (!row) return '—';
  if (row.categoryId != null) {
    const category = reference.categories.find((c) => c.id === row.categoryId);
    return category ? soilCategoryLabel(category.key, t) : '—';
  }
  if (row.numericValue != null) return `${row.numericValue}${row.unit ? ` ${row.unit}` : ''}`;
  return row.textValue || '—';
}

export function measurementRows(
  left: SoilInvestigationDetail,
  right: SoilInvestigationDetail,
  reference: SoilReferenceData,
  t: Translate
): CompareRow[] {
  const rows: CompareRow[] = [];
  for (const parameter of reference.parameters) {
    const forms: SoilNutrientForm[] = parameter.supportsForms ? ['Total', 'Available'] : ['None'];
    for (const form of forms) {
      const a = valueText(left, parameter.id, form, reference, t);
      const b = valueText(right, parameter.id, form, reference, t);
      if (a === '—' && b === '—') continue;
      const name = soilParameterLabel(parameter.key, t);
      rows.push({
        key: `${parameter.id}:${form}`,
        label: form === 'None' ? name : `${name} · ${t(form === 'Total' ? 'soil.formTotal' : 'soil.formAvailable')}`,
        left: a,
        right: b,
        changed: a !== b,
      });
    }
  }
  return rows;
}

export function pointRows(
  left: SoilFertilityAssessmentDetail | null,
  right: SoilFertilityAssessmentDetail | null,
  t: (key: string) => string
): CompareRow[] {
  const keys = new Set([
    ...(left?.results ?? []).map((r) => r.factorKey),
    ...(right?.results ?? []).map((r) => r.factorKey),
  ]);

  return [...keys].map((key) => {
    const a = left?.results.find((r) => r.factorKey === key);
    const b = right?.results.find((r) => r.factorKey === key);
    const text = (points: number | null | undefined, max: number | undefined) =>
      points == null || max == null ? '—' : `${points} / ${max}`;
    const leftText = text(a?.points, a?.maximumPoints);
    const rightText = text(b?.points, b?.maximumPoints);
    return {
      key,
      label: t(`soil.factor.${key}`) === `soil.factor.${key}` ? key : t(`soil.factor.${key}`),
      left: leftText,
      right: rightText,
      changed: leftText !== rightText,
    };
  });
}
