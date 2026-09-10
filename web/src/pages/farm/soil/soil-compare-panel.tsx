import { useState } from 'react';

import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { bandFor, soilBandLabel } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type {
  SoilFertilityAssessmentDetail,
  SoilInvestigation,
  SoilInvestigationDetail,
  SoilReferenceData,
} from '@/types/soil';
import { measurementRows, pointRows, type CompareRow } from './soil-compare-rows';

type Props = {
  investigations: SoilInvestigation[];
  reference: SoilReferenceData;
  load: (id: number) => Promise<{ detail: SoilInvestigationDetail; assessment: SoilFertilityAssessmentDetail | null }>;
};

type Side = { detail: SoilInvestigationDetail; assessment: SoilFertilityAssessmentDetail | null } | null;

export function SoilComparePanel({ investigations, reference, load }: Props) {
  const { t, language } = useLanguage();

  const [leftId, setLeftId] = useState<number | null>(investigations[1]?.id ?? null);
  const [rightId, setRightId] = useState<number | null>(investigations[0]?.id ?? null);
  const [left, setLeft] = useState<Side>(null);
  const [right, setRight] = useState<Side>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (leftId == null || rightId == null) return;
    setBusy(true);
    try {
      const [a, b] = await Promise.all([load(leftId), load(rightId)]);
      setLeft(a);
      setRight(b);
    } finally {
      setBusy(false);
    }
  }

  function picker(value: number | null, onChange: (id: number) => void, label: string) {
    return (
      <div className="field">
        <label>{label}</label>
        <select value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))}>
          {investigations.map((row) => (
            <option key={row.id} value={row.id}>
              {formatLocalizedIsoDay(row.investigationDate, language)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  function table(title: string, rows: CompareRow[]) {
    if (rows.length === 0) return null;
    return (
      <>
        <h3 className="soil-section-title">{title}</h3>
        <div className="soil-compare-rows">
          {rows.map((row) => (
            <div key={row.key} className={row.changed ? 'soil-compare-row changed' : 'soil-compare-row'}>
              <span>{row.label}</span>
              <span>{row.left}</span>
              <span>→</span>
              <span>{row.right}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  if (investigations.length < 2) return <p className="empty-state">{t('soil.compareNeedsTwo')}</p>;

  const leftBand = bandFor(reference, left?.assessment?.assessment.categoryId ?? null);
  const rightBand = bandFor(reference, right?.assessment?.assessment.categoryId ?? null);

  return (
    <>
      <div className="modal-form-grid soil-compare-pickers">
        {picker(leftId, setLeftId, t('soil.compareFrom'))}
        {picker(rightId, setRightId, t('soil.compareTo'))}
      </div>
      <button type="button" className="btn" onClick={run} disabled={busy}>
        {t('soil.compare')}
      </button>

      {left && right && (
        <>
          <h3 className="soil-section-title">{t('soil.fertility')}</h3>
          <div className="soil-compare-score">
            <span>
              {left.assessment?.assessment.isComplete ? left.assessment.assessment.score : '—'}
              {leftBand ? ` · ${soilBandLabel(leftBand.key, t)}` : ''}
            </span>
            <span>→</span>
            <span>
              {right.assessment?.assessment.isComplete ? right.assessment.assessment.score : '—'}
              {rightBand ? ` · ${soilBandLabel(rightBand.key, t)}` : ''}
            </span>
          </div>

          {table(t('soil.comparePoints'), pointRows(left.assessment, right.assessment, t))}
          {table(t('soil.compareMeasurements'), measurementRows(left.detail, right.detail, reference, t))}
        </>
      )}
    </>
  );
}
