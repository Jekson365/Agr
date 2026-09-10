import { CardMenu } from '@/components/farm/card-menu';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { SOIL_STATUS_OPTIONS } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { SoilInvestigation } from '@/types/soil';

type Props = {
  investigations: SoilInvestigation[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (investigation: SoilInvestigation) => void;
};

export function SoilInvestigationList({ investigations, selectedId, onSelect, onEdit, onDelete }: Props) {
  const { t, language } = useLanguage();

  if (investigations.length === 0) return <p className="empty-state">{t('soil.empty')}</p>;

  return (
    <div className="soil-list">
      {investigations.map((row) => {
        const status = SOIL_STATUS_OPTIONS.find((option) => option.value === row.status);
        const meta = [row.laboratory, row.sampleNumber].filter(Boolean).join(' · ');
        return (
          <div key={row.id} className={row.id === selectedId ? 'soil-card selected' : 'soil-card'}>
            <button type="button" className="soil-card-summary" onClick={() => onSelect(row.id)}>
              <span className="soil-card-date">{formatLocalizedIsoDay(row.investigationDate, language)}</span>
              {meta && <span className="soil-card-meta">{meta}</span>}
              {status && <span className={`soil-status soil-status-${row.status.toLowerCase()}`}>{t(status.labelKey)}</span>}
            </button>
            {row.reportPath && (
              <a className="soil-report-link" href={resolveAssetUrl(row.reportPath)} target="_blank" rel="noreferrer">
                {t('soil.openReport')}
              </a>
            )}
            <CardMenu onEdit={() => onEdit(row.id)} onDelete={() => onDelete(row)} />
          </div>
        );
      })}
    </div>
  );
}
