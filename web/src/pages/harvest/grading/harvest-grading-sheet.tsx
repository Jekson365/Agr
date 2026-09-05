import { useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { saveHarvestAssessmentSheet } from '@/services/harvest-assessment-service';
import type { AssessmentCriteria } from '@/types/assessment-criteria';
import { ASSESSMENT_GRADES, type HarvestAssessment } from '@/types/harvest-assessment';
import { HarvestGradingRow } from './harvest-grading-row';
import type { GradedGood } from './use-harvest-grading';
import './harvest-grading-sheet.css';
import './harvest-grading-table.css';

type Props = {
  harvestId: number;
  good: GradedGood;
  saved: HarvestAssessment[];
  criteria: AssessmentCriteria[];
  onSaved: (good: GradedGood, rows: HarvestAssessment[]) => void;
};

type Draft = { quantity: string; wasted: string };

function draftsFrom(saved: HarvestAssessment[]): Record<string, Draft> {
  const drafts: Record<string, Draft> = {};
  for (const grade of ASSESSMENT_GRADES) {
    const row = saved.find((item) => item.grade === grade);
    drafts[grade] = {
      quantity: row && row.quantity > 0 ? String(row.quantity) : '',
      wasted: row && row.wasted > 0 ? String(row.wasted) : '',
    };
  }
  return drafts;
}

export function HarvestGradingSheet({ harvestId, good, saved, criteria, onSaved }: Props) {
  const { t } = useLanguage();

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => draftsFrom(saved));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Only the bands the good actually sorts into: one it switched off is not offered here, though
  // a good with no standard yet still gets all four.
  const bands = criteria.length === 0
    ? ASSESSMENT_GRADES
    : ASSESSMENT_GRADES.filter((grade) => criteria.find((row) => row.grade === grade)?.isActive);

  // Plant stock is judged on its measurements alone — its card hides damaged/rotten, so the
  // sheet does too rather than showing two columns that can only ever read as a dash.
  const showSpoilage = good.treeStockId != null;

  const num = (value: string) => Math.max(0, parseFloat(value) || 0);
  const graded = ASSESSMENT_GRADES.reduce((sum, grade) => sum + num(drafts[grade].quantity), 0);
  const wasted = ASSESSMENT_GRADES.reduce((sum, grade) => sum + num(drafts[grade].wasted), 0);
  // The bands and the waste split the pick between them, so together they cannot come to more
  // than it. The tolerance is for the decimals a sum of typed figures carries, not a real
  // overshoot.
  const accounted = graded + wasted;
  const over = accounted - good.harvested > 1e-6;

  function setField(grade: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [grade]: { ...prev[grade], ...patch } }));
    setDone(false);
  }

  async function save() {
    if (over) return;
    setSaving(true);
    setError(null);
    try {
      // A band nothing came out at is left out rather than saved as a zero line.
      const lines = bands
        .map((grade) => ({
          grade,
          quantity: num(drafts[grade].quantity),
          wasted: num(drafts[grade].wasted),
        }))
        .filter((line) => line.quantity > 0 || line.wasted > 0);

      const rows = await saveHarvestAssessmentSheet({
        harvestId,
        stockId: good.stockId,
        treeStockId: good.treeStockId,
        lines,
      });
      onSaved(good, rows);
      setDone(true);
    } catch (err) {
      // The results behind the harvested figure can move while a sheet is open, so the server
      // refuses an overshoot this form thought was fine.
      setError(
        err instanceof ApiError && err.status === 409
          ? t('harvestGrading.overHarvested')
          : t('farm.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="hg-sheet">
      <div className="hg-sheet-head">
        <h2 className="hg-sheet-title">{good.label}</h2>
        <span className="hg-sheet-totals">
          {t('harvestGrading.harvested', { amount: good.harvested, unit: good.unitLabel })}
          <span className={over ? 'hg-sheet-graded over' : 'hg-sheet-graded'}>
            {t('harvestGrading.graded', { amount: accounted, unit: good.unitLabel })}
          </span>
        </span>
      </div>

      {criteria.length === 0 && <p className="hg-no-criteria">{t('harvestGrading.noCriteria')}</p>}

      {error && <div className="error-banner">{error}</div>}

      <div className="hg-table-wrap">
        <table className="hg-table">
          <thead>
            <tr>
              <th className="hg-col-grade">{t('assessment.colGrade')}</th>
              <th className="hg-col-range">{t('assessment.colSize')}</th>
              <th className="hg-col-range">{t('assessment.colWeight')}</th>
              {showSpoilage && <th className="hg-col-percent">{t('assessment.colDamaged')}</th>}
              {showSpoilage && <th className="hg-col-percent">{t('assessment.colRotten')}</th>}
              <th className="hg-col-percent">{t('assessment.colMoisture')}</th>
              <th className="hg-col-color">{t('assessment.colColor')}</th>
              <th className="hg-col-quantity">{t('harvestGrading.colQuantity')}</th>
              <th className="hg-col-quantity">{t('harvestGrading.colWasted')}</th>
            </tr>
          </thead>
          <tbody>
            {bands.map((grade) => (
              <HarvestGradingRow
                key={grade}
                grade={grade}
                criteria={criteria.find((row) => row.grade === grade) ?? null}
                quantity={drafts[grade].quantity}
                wasted={drafts[grade].wasted}
                unitLabel={good.unitLabel}
                showSpoilage={showSpoilage}
                onQuantity={(value) => setField(grade, { quantity: value })}
                onWasted={(value) => setField(grade, { wasted: value })}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="hg-actions">
        {over && <span className="hg-over">{t('harvestGrading.overHarvested')}</span>}
        {done && !over && <span className="hg-saved">{t('harvestGrading.saved')}</span>}
        <button type="button" className="btn" onClick={save} disabled={saving || over}>
          {t('common.save')}
        </button>
      </div>
    </section>
  );
}
