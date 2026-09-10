import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { bandClassFor, bandFor, soilBandLabel } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilFertilityAssessmentDetail, SoilInvestigation, SoilReferenceData } from '@/types/soil';

type Props = {
  latest: SoilInvestigation | null;
  assessment: SoilFertilityAssessmentDetail | null;
  reference: SoilReferenceData;
  count: number;
};

export function SoilOverviewPanel({ latest, assessment, reference, count }: Props) {
  const { t, language } = useLanguage();

  if (!latest) return <p className="empty-state">{t('soil.empty')}</p>;

  const band = bandFor(reference, assessment?.assessment.categoryId ?? null);
  const complete = assessment?.assessment.isComplete ?? false;

  return (
    <>
      <dl className="soil-facts">
        <div>
          <dt>{t('soil.latestInvestigation')}</dt>
          <dd>{formatLocalizedIsoDay(latest.investigationDate, language)}</dd>
        </div>
        <div>
          <dt>{t('soil.investigationCount')}</dt>
          <dd>{count}</dd>
        </div>
        {latest.laboratory && (
          <div>
            <dt>{t('soil.laboratory')}</dt>
            <dd>{latest.laboratory}</dd>
          </div>
        )}
        {latest.sampleNumber && (
          <div>
            <dt>{t('soil.sampleNumber')}</dt>
            <dd>{latest.sampleNumber}</dd>
          </div>
        )}
      </dl>

      <h3 className="soil-section-title">{t('soil.fertility')}</h3>
      {complete && assessment ? (
        <div className="soil-score">
          <span className="soil-score-value">
            {assessment.assessment.score} <span className="soil-score-max">/ {assessment.assessment.maxScore}</span>
          </span>
          {band && <span className={`soil-band ${bandClassFor(band.key)}`}>{soilBandLabel(band.key, t)}</span>}
        </div>
      ) : (
        <p className="soil-incomplete">{t('soil.insufficientData')}</p>
      )}

      {reference.ruleSet && (
        <p className="limit-hint soil-ruleset">
          {reference.ruleSet.name} · {reference.ruleSet.source} · {t('soil.version')} {reference.ruleSet.version}
        </p>
      )}
    </>
  );
}
