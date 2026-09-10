import { BarChart, type BarDatum } from '@/components/charts/bar-chart';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { bandClassFor, bandFor, soilBandLabel } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilFertilityAssessment, SoilInvestigation, SoilReferenceData } from '@/types/soil';

type Props = {
  assessments: SoilFertilityAssessment[];
  investigations: SoilInvestigation[];
  reference: SoilReferenceData;
};

export function SoilHistoryPanel({ assessments, investigations, reference }: Props) {
  const { t, language } = useLanguage();

  const scored = assessments.filter((assessment) => assessment.isComplete);
  if (scored.length === 0) return <p className="empty-state">{t('soil.noHistory')}</p>;

  const dateOf = (assessment: SoilFertilityAssessment) =>
    investigations.find((row) => row.id === assessment.soilInvestigationId)?.investigationDate ?? '';

  const bars: BarDatum[] = scored.map((assessment) => ({
    label: dateOf(assessment).slice(0, 4),
    tooltipLabel: formatLocalizedIsoDay(dateOf(assessment), language),
    value: assessment.score,
    color: 'var(--color-green-muted)',
    borderColor: 'var(--color-green)',
  }));

  return (
    <>
      <div className="soil-history-chart">
        <BarChart data={bars} ariaLabel={t('soil.history')} />
      </div>

      <div className="soil-history-rows">
        {scored.map((assessment) => {
          const band = bandFor(reference, assessment.categoryId);
          return (
            <div key={assessment.id} className="soil-history-row">
              <span>{formatLocalizedIsoDay(dateOf(assessment), language)}</span>
              <span className="soil-history-score">
                {assessment.score} / {assessment.maxScore}
              </span>
              {band && <span className={`soil-band ${bandClassFor(band.key)}`}>{soilBandLabel(band.key, t)}</span>}
            </div>
          );
        })}
      </div>
    </>
  );
}
