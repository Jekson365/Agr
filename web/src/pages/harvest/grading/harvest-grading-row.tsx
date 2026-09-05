import { percentText, rangeText } from '@/components/farm/assessment/criteria-draft';
import { useLanguage } from '@/contexts/language-context';
import type { AssessmentCriteria } from '@/types/assessment-criteria';
import type { AssessmentGrade } from '@/types/harvest-assessment';
import './harvest-grading-table.css';

type Props = {
  grade: AssessmentGrade;
  /** The good's standard for this band, or null where it has none. Read-only here — it is set on
   *  the good's own page. */
  criteria: AssessmentCriteria | null;
  quantity: string;
  wasted: string;
  unitLabel: string;
  /** Whether the good's standard carries damaged/rotten at all — mirrors the card the standard
   *  is set on, so the sheet never shows a column that source can't fill. */
  showSpoilage: boolean;
  onQuantity: (value: string) => void;
  onWasted: (value: string) => void;
};

/** One band's line: what the good's standard says it is, and how much of this harvest came out
 *  at it — the only figure recorded here. */
export function HarvestGradingRow({
  grade,
  criteria,
  quantity,
  wasted,
  unitLabel,
  showSpoilage,
  onQuantity,
  onWasted,
}: Props) {
  const { t } = useLanguage();
  const upTo = t('assessment.upTo');

  return (
    <tr>
      <td className="hg-col-grade">
        <span className={`hg-grade hg-grade-${grade.toLowerCase()}`}>{grade}</span>
      </td>
      <td className="hg-col-range hg-read">
        {criteria ? rangeText(criteria.sizeFrom, criteria.sizeTo, upTo, t('assessment.unitSize')) : '—'}
      </td>
      <td className="hg-col-range hg-read">
        {criteria
          ? rangeText(criteria.weightFrom, criteria.weightTo, upTo, t('assessment.unitWeight'))
          : '—'}
      </td>
      {showSpoilage && <td className="hg-col-percent hg-read">{criteria ? percentText(criteria.damaged) : '—'}</td>}
      {showSpoilage && <td className="hg-col-percent hg-read">{criteria ? percentText(criteria.rotten) : '—'}</td>}
      <td className="hg-col-percent hg-read">{criteria ? percentText(criteria.moisture) : '—'}</td>
      <td className="hg-col-color hg-read">{criteria?.color.trim() || '—'}</td>
      <td className="hg-col-quantity">
        <span className="hg-quantity">
          <input
            value={quantity}
            onChange={(e) => onQuantity(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
          <span className="hg-unit">{unitLabel}</span>
        </span>
      </td>
      <td className="hg-col-quantity">
        <span className="hg-quantity">
          <input
            value={wasted}
            onChange={(e) => onWasted(e.target.value)}
            placeholder="0"
            inputMode="decimal"
          />
          <span className="hg-unit">{unitLabel}</span>
        </span>
      </td>
    </tr>
  );
}
