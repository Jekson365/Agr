import type { AssessmentCriteria, AssessmentCriteriaLine } from '@/types/assessment-criteria';
import { ASSESSMENT_GRADES, type AssessmentGrade } from '@/types/harvest-assessment';

/** The measure fields, in the order the sheet's columns read. */
export const MEASURE_FIELDS = [
  'sizeFrom',
  'sizeTo',
  'weightFrom',
  'weightTo',
  'damaged',
  'rotten',
  'moisture',
] as const;

export type MeasureField = (typeof MEASURE_FIELDS)[number];

/** Every figure is held as typed, so a half-entered number stays as typed; parsed on the way out. */
export type CriteriaDraft = Record<MeasureField, string> & { color: string; isActive: boolean };

const EMPTY: CriteriaDraft = {
  sizeFrom: '',
  sizeTo: '',
  weightFrom: '',
  weightTo: '',
  damaged: '',
  rotten: '',
  moisture: '',
  color: '',
  isActive: true,
};

function text(value: number | null): string {
  return value == null ? '' : String(value);
}

export function draftsFrom(saved: AssessmentCriteria[]): Record<string, CriteriaDraft> {
  const drafts: Record<string, CriteriaDraft> = {};
  for (const grade of ASSESSMENT_GRADES) {
    const row = saved.find((item) => item.grade === grade);
    drafts[grade] = row
      ? {
          sizeFrom: text(row.sizeFrom),
          sizeTo: text(row.sizeTo),
          weightFrom: text(row.weightFrom),
          weightTo: text(row.weightTo),
          damaged: text(row.damaged),
          rotten: text(row.rotten),
          moisture: text(row.moisture),
          color: row.color,
          isActive: row.isActive,
        }
      : { ...EMPTY };
  }
  return drafts;
}

/** A blank field is not part of the standard, which is not the same as a standard of zero. */
export function figure(value: string): number | null {
  const parsed = parseFloat(value);
  return value.trim() === '' || Number.isNaN(parsed) ? null : parsed;
}

/** True while the band says nothing at all. Only a band that is also switched off is dropped —
 *  an active one is saved even when empty, so the good keeps the bands it sorts into. */
export function isBlank(draft: CriteriaDraft): boolean {
  return draft.color.trim() === '' && MEASURE_FIELDS.every((field) => figure(draft[field]) == null);
}

export function toLine(grade: AssessmentGrade, draft: CriteriaDraft): AssessmentCriteriaLine {
  return {
    grade,
    isActive: draft.isActive,
    sizeFrom: figure(draft.sizeFrom),
    sizeTo: figure(draft.sizeTo),
    weightFrom: figure(draft.weightFrom),
    weightTo: figure(draft.weightTo),
    damaged: figure(draft.damaged),
    rotten: figure(draft.rotten),
    moisture: figure(draft.moisture),
    color: draft.color.trim(),
  };
}

/** A percentage outside 0–100, or a negative measure, which the server refuses too. */
export function isOutOfRange(draft: CriteriaDraft): boolean {
  const percents: MeasureField[] = ['damaged', 'rotten', 'moisture'];
  const outOfPercent = percents.some((field) => {
    const value = figure(draft[field]);
    return value != null && (value < 0 || value > 100);
  });
  if (outOfPercent) return true;

  const measures: MeasureField[] = ['sizeFrom', 'sizeTo', 'weightFrom', 'weightTo'];
  return measures.some((field) => {
    const value = figure(draft[field]);
    return value != null && value < 0;
  });
}

/** How a saved range reads where it is only shown: "6–10 mm", "6+ mm", "10 მდე mm", or a dash. */
export function rangeText(
  from: number | null,
  to: number | null,
  upTo: string,
  unit: string
): string {
  if (from != null && to != null) return `${from}–${to} ${unit}`;
  if (from != null) return `${from}+ ${unit}`;
  if (to != null) return `${to} ${upTo} ${unit}`;
  return '—';
}

export function percentText(value: number | null): string {
  return value == null ? '—' : `${value}%`;
}
