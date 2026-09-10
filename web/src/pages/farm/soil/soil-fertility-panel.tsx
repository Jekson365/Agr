import { bandClassFor, bandFor, soilBandLabel, soilFactorLabel } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilFertilityAssessmentDetail, SoilReferenceData } from '@/types/soil';

type Props = {
  detail: SoilFertilityAssessmentDetail | null;
  reference: SoilReferenceData;
};

function round1(value: number): string {
  return String(Math.round(value * 10) / 10);
}

export function SoilFertilityPanel({ detail, reference }: Props) {
  const { t } = useLanguage();

  if (!detail) return <p className="empty-state">{t('soil.noAssessment')}</p>;

  const { assessment, results, limitations, missingFactors } = detail;
  const band = bandFor(reference, assessment.categoryId);

  return (
    <div className="soil-fertility">
      {assessment.isComplete ? (
        <div className="soil-score">
          <span className="soil-score-value">
            {round1(assessment.score)} <span className="soil-score-max">/ {assessment.maxScore}</span>
          </span>
          {band && <span className={`soil-band ${bandClassFor(band.key)}`}>{soilBandLabel(band.key, t)}</span>}
        </div>
      ) : (
        <div className="soil-incomplete">
          <p>{t('soil.insufficientData')}</p>
          {missingFactors.length > 0 && (
            <p className="limit-hint">
              {t('soil.missingFactors')}: {missingFactors.map((key) => soilFactorLabel(key, t)).join(', ')}
            </p>
          )}
        </div>
      )}

      <h3 className="soil-section-title">{t('soil.assessmentBreakdown')}</h3>
      <div className="soil-factor-rows">
        {results.map((row) => (
          <div key={row.id || row.factorKey} className="soil-factor-row">
            <span className="soil-factor-name">{soilFactorLabel(row.factorKey, t)}</span>
            <span className="soil-factor-input">{row.inputValue || '—'}</span>
            <span className="soil-factor-points">
              {row.points == null ? '—' : round1(row.points)} / {row.maximumPoints}
            </span>
            <span className="soil-factor-note">
              {row.explanation === 'matched'
                ? row.pointsMin === row.pointsMax
                  ? ''
                  : t('soil.explainRange', { min: String(row.pointsMin), max: String(row.pointsMax) })
                : t(`soil.explain.${row.explanation}`)}
            </span>
          </div>
        ))}
      </div>

      {limitations.length > 0 && (
        <>
          <h3 className="soil-section-title">{t('soil.limitations')}</h3>
          <ul className="soil-limitations">
            {limitations.map((key) => (
              <li key={key}>{soilFactorLabel(key, t)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
