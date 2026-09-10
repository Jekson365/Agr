import type { BarDatum } from '@/components/charts/bar-chart';
import { ASSESSMENT_GRADES } from '@/types/harvest-assessment';
import type { AssessmentGrade, HarvestAssessmentLine } from '@/types/harvest-assessment';

export const ASSESSMENT_GRADE_FILL: Record<AssessmentGrade, string> = {
  A: 'var(--color-green-muted)',
  B: 'var(--color-blue-soft)',
  C: 'var(--color-amber-soft)',
  D: 'var(--color-danger-bg)',
};

export const ASSESSMENT_GRADE_COLOR: Record<AssessmentGrade, string> = {
  A: 'var(--color-green)',
  B: 'var(--color-blue)',
  C: 'var(--color-amber)',
  D: 'var(--color-danger)',
};

export function gradeDistributionBars(
  lines: HarvestAssessmentLine[],
  usableLabel: string,
  wastedLabel: string
): BarDatum[] {
  return ASSESSMENT_GRADES.flatMap((grade) => {
    const band = lines.filter((line) => line.grade === grade);
    return [
      {
        label: grade,
        tooltipLabel: `${grade} · ${usableLabel}`,
        value: band.reduce((sum, line) => sum + line.quantity, 0),
        color: ASSESSMENT_GRADE_FILL[grade],
        borderColor: ASSESSMENT_GRADE_COLOR[grade],
      },
      {
        label: grade,
        tooltipLabel: `${grade} · ${wastedLabel}`,
        value: band.reduce((sum, line) => sum + line.wasted, 0),
        color: 'var(--color-danger)',
      },
    ];
  });
}
