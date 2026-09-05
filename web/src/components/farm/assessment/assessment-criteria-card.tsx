import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getAssessmentCriteria, saveAssessmentCriteria } from '@/services/assessment-criteria-service';
import { ASSESSMENT_GRADES } from '@/types/harvest-assessment';
import { draftsFrom, isBlank, isOutOfRange, toLine, type CriteriaDraft } from './criteria-draft';
import { CriteriaRow } from './criteria-row';
import './assessment-criteria.css';

type Props = {
  stockId?: number;
  treeStockId?: number;
  /** A removed good keeps its standard on show, but nothing about it is written any more. */
  canEdit?: boolean;
  /** Whether the damaged and rotten columns are asked for. Off where the page judges a good on
   *  its measurements alone; whatever those two already hold is saved back unchanged. */
  showSpoilage?: boolean;
};

/** A good's grading standard: what each band means for it. Set here and read everywhere else —
 *  a harvest's assessment only records how much came out at each band. */
export function AssessmentCriteriaCard({
  stockId,
  treeStockId,
  canEdit = true,
  showSpoilage = true,
}: Props) {
  const { t } = useLanguage();

  const [drafts, setDrafts] = useState<Record<string, CriteriaDraft>>(() => draftsFrom([]));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAssessmentCriteria({ stockId, treeStockId })
      .then((rows) => {
        if (!cancelled) setDrafts(draftsFrom(rows));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stockId, treeStockId]);

  const invalid = ASSESSMENT_GRADES.some((grade) => isOutOfRange(drafts[grade]));
  const active = ASSESSMENT_GRADES.filter((grade) => drafts[grade].isActive).length;

  function toggle(grade: string) {
    setField(grade, { isActive: !drafts[grade].isActive });
  }

  function setField(grade: string, patch: Partial<CriteriaDraft>) {
    setDrafts((prev) => ({ ...prev, [grade]: { ...prev[grade], ...patch } }));
    setDone(false);
  }

  async function save() {
    if (invalid) return;
    setSaving(true);
    setError(null);
    try {
      // A band in use is saved even when it is still blank — that is what remembers the good
      // sorts into it. Only one that is switched off and says nothing is left out entirely.
      const lines = ASSESSMENT_GRADES.filter(
        (grade) => drafts[grade].isActive || !isBlank(drafts[grade])
      ).map((grade) => toLine(grade, drafts[grade]));
      const rows = await saveAssessmentCriteria({
        stockId: stockId ?? null,
        treeStockId: treeStockId ?? null,
        lines,
      });
      setDrafts(draftsFrom(rows));
      setDone(true);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ac-card">
      <div className="ac-card-head">
        <h2 className="ac-title">{t('assessment.title')}</h2>
        <p className="ac-hint">{t('assessment.hint')}</p>
        <span className="ac-count">
          {t('assessment.activeCount', { count: active, total: ASSESSMENT_GRADES.length })}
        </span>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <p className="limit-hint">…</p>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th className="ac-col-grade">{t('assessment.colGrade')}</th>
                <th className="ac-col-range">{t('assessment.colSize')}</th>
                <th className="ac-col-range">{t('assessment.colWeight')}</th>
                {showSpoilage && <th className="ac-col-percent">{t('assessment.colDamaged')}</th>}
                {showSpoilage && <th className="ac-col-percent">{t('assessment.colRotten')}</th>}
                <th className="ac-col-percent">{t('assessment.colMoisture')}</th>
                <th className="ac-col-color">{t('assessment.colColor')}</th>
                <th className="ac-col-state">{t('assessment.colState')}</th>
              </tr>
            </thead>
            <tbody>
              {ASSESSMENT_GRADES.map((grade) => (
                <CriteriaRow
                  key={grade}
                  grade={grade}
                  draft={drafts[grade]}
                  showSpoilage={showSpoilage}
                  canEdit={canEdit}
                  onChange={(patch) => setField(grade, patch)}
                  onToggle={() => toggle(grade)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canEdit && !loading && (
        <div className="ac-actions">
          {invalid && <span className="ac-invalid">{t('assessment.outOfRange')}</span>}
          {done && !invalid && <span className="ac-saved">{t('assessment.saved')}</span>}
          <button type="button" className="btn" onClick={save} disabled={saving || invalid}>
            {t('common.save')}
          </button>
        </div>
      )}
    </section>
  );
}
