import { formsFor, unitFor } from '@/config/soil';
import type {
  SoilInvestigationDetail,
  SoilInvestigationDetailInput,
  SoilInvestigationStatus,
  SoilNutrientForm,
  SoilReferenceData,
} from '@/types/soil';

export type ResultDraft = { value: string; unit: string; categoryId: string; text: string };

export type InvestigationDraft = {
  investigationDate: string;
  samplingDate: string;
  samplingDepthCm: string;
  laboratory: string;
  sampleNumber: string;
  status: SoilInvestigationStatus;
  notes: string;
  reportPath: string;
  results: Record<string, ResultDraft>;
};

export function resultKey(parameterId: number, form: SoilNutrientForm): string {
  return `${parameterId}:${form}`;
}

function blankResults(reference: SoilReferenceData): Record<string, ResultDraft> {
  const results: Record<string, ResultDraft> = {};
  for (const parameter of reference.parameters) {
    for (const form of formsFor(parameter.supportsForms)) {
      results[resultKey(parameter.id, form)] = {
        value: '',
        unit: unitFor(parameter, form),
        categoryId: '',
        text: '',
      };
    }
  }
  return results;
}

export function emptyDraft(reference: SoilReferenceData): InvestigationDraft {
  return {
    investigationDate: '',
    samplingDate: '',
    samplingDepthCm: '',
    laboratory: '',
    sampleNumber: '',
    status: 'Draft',
    notes: '',
    reportPath: '',
    results: blankResults(reference),
  };
}

export function draftFrom(detail: SoilInvestigationDetail, reference: SoilReferenceData): InvestigationDraft {
  const results = blankResults(reference);
  for (const row of detail.results) {
    const key = resultKey(row.parameterId, row.form);
    const parameter = reference.parameters.find((p) => p.id === row.parameterId);
    results[key] = {
      value: row.numericValue == null ? '' : String(row.numericValue),
      unit: parameter ? unitFor(parameter, row.form) : row.unit,
      categoryId: row.categoryId == null ? '' : String(row.categoryId),
      text: row.textValue,
    };
  }

  const { investigation } = detail;
  return {
    investigationDate: investigation.investigationDate,
    samplingDate: investigation.samplingDate ?? '',
    samplingDepthCm: investigation.samplingDepthCm == null ? '' : String(investigation.samplingDepthCm),
    laboratory: investigation.laboratory,
    sampleNumber: investigation.sampleNumber,
    status: investigation.status,
    notes: investigation.notes,
    reportPath: investigation.reportPath,
    results,
  };
}

function num(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toInput(
  landPlotId: number,
  draft: InvestigationDraft,
  reference: SoilReferenceData,
  id?: number
): SoilInvestigationDetailInput {
  const results = [];
  for (const parameter of reference.parameters) {
    for (const form of formsFor(parameter.supportsForms)) {
      const entry = draft.results[resultKey(parameter.id, form)];
      if (!entry) continue;

      const numericValue = parameter.valueKind === 'Numeric' ? num(entry.value) : null;
      const categoryId = parameter.valueKind === 'Category' && entry.categoryId ? Number(entry.categoryId) : null;
      const textValue = parameter.valueKind === 'Text' ? entry.text.trim() : '';
      if (numericValue == null && categoryId == null && !textValue) continue;

      results.push({
        parameterId: parameter.id,
        form,
        numericValue,
        categoryId,
        textValue,
        unit: entry.unit.trim(),
      });
    }
  }

  return {
    investigation: {
      id,
      landPlotId,
      investigationDate: draft.investigationDate,
      samplingDate: draft.samplingDate || null,
      samplingDepthCm: num(draft.samplingDepthCm),
      laboratory: draft.laboratory.trim(),
      sampleNumber: draft.sampleNumber.trim(),
      status: draft.status,
      notes: draft.notes.trim(),
      reportPath: draft.reportPath,
    },
    results,
  };
}
