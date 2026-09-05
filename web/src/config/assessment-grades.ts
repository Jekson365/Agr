import type { AssessmentGrade } from '@/types/harvest-assessment';

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
