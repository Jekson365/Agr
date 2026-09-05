import { useLanguage } from '@/contexts/language-context';
import type { AssessmentGrade } from '@/types/harvest-assessment';
import type { CriteriaDraft, MeasureField } from './criteria-draft';
import './assessment-criteria.css';

type Props = {
  grade: AssessmentGrade;
  draft: CriteriaDraft;
  /** False where the page leaves the spoilage columns off — the figures already saved for them
   *  are carried through untouched, they are just not asked for here. */
  showSpoilage: boolean;
  onToggle: () => void;
  /** False for a removed good: its standard stays readable, but nothing is written any more. */
  canEdit: boolean;
  onChange: (patch: Partial<CriteriaDraft>) => void;
};

/** One band of a good's standard: the ranges it holds to, what it tolerates, and its colour. */
export function CriteriaRow({ grade, draft, showSpoilage, canEdit, onChange, onToggle }: Props) {
  const off = !draft.isActive;
  const { t } = useLanguage();

  function range(from: MeasureField, to: MeasureField, unit: string) {
    return (
      <span className="ac-range">
        <input
          value={draft[from]}
          onChange={(e) => onChange({ [from]: e.target.value } as Partial<CriteriaDraft>)}
          placeholder={t('assessment.rangeFrom')}
          inputMode="decimal"
          disabled={!canEdit || off}
        />
        <span className="ac-range-dash">–</span>
        <input
          value={draft[to]}
          onChange={(e) => onChange({ [to]: e.target.value } as Partial<CriteriaDraft>)}
          placeholder={t('assessment.rangeTo')}
          inputMode="decimal"
          disabled={!canEdit || off}
        />
        <span className="ac-unit">{unit}</span>
      </span>
    );
  }

  function percent(field: MeasureField) {
    return (
      <span className="ac-percent">
        <input
          value={draft[field]}
          onChange={(e) => onChange({ [field]: e.target.value } as Partial<CriteriaDraft>)}
          placeholder="0"
          inputMode="decimal"
          disabled={!canEdit || off}
        />
        <span className="ac-unit">%</span>
      </span>
    );
  }

  return (
    <tr className={off ? 'ac-row-off' : undefined}>
      <td className="ac-col-grade">
        <span className={`ac-grade ac-grade-${grade.toLowerCase()}`}>{grade}</span>
      </td>
      <td className="ac-col-range">{range('sizeFrom', 'sizeTo', t('assessment.unitSize'))}</td>
      <td className="ac-col-range">{range('weightFrom', 'weightTo', t('assessment.unitWeight'))}</td>
      {showSpoilage && <td className="ac-col-percent">{percent('damaged')}</td>}
      {showSpoilage && <td className="ac-col-percent">{percent('rotten')}</td>}
      <td className="ac-col-percent">{percent('moisture')}</td>
      <td className="ac-col-color">
        <input
          value={draft.color}
          onChange={(e) => onChange({ color: e.target.value })}
          placeholder={t('assessment.colorPlaceholder')}
          disabled={!canEdit || off}
        />
      </td>
      <td className="ac-col-state">
        <button
          type="button"
          className={off ? 'ac-toggle off' : 'ac-toggle'}
          disabled={!canEdit}
          onClick={onToggle}
        >
          {t(off ? 'assessment.activate' : 'assessment.deactivate')}
        </button>
      </td>
    </tr>
  );
}
