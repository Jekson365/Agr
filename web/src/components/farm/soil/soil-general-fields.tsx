import { DateField } from '@/components/ui/date-field';
import { SOIL_STATUS_OPTIONS } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilInvestigationStatus } from '@/types/soil';
import type { InvestigationDraft } from './soil-draft';

type Props = {
  draft: InvestigationDraft;
  uploading: boolean;
  onPatch: (patch: Partial<InvestigationDraft>) => void;
  onReport: (file: File) => void;
};

export function SoilGeneralFields({ draft, uploading, onPatch, onReport }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="modal-form-grid">
        <div className="field">
          <label>{t('soil.investigationDate')}</label>
          <DateField
            value={draft.investigationDate}
            clearable={false}
            onChange={(v) => onPatch({ investigationDate: v ?? '' })}
          />
        </div>

        <div className="field">
          <label>{t('soil.samplingDate')}</label>
          <DateField value={draft.samplingDate} onChange={(v) => onPatch({ samplingDate: v ?? '' })} />
        </div>

        <div className="field">
          <label>{t('soil.samplingDepth')}</label>
          <input
            value={draft.samplingDepthCm}
            onChange={(e) => onPatch({ samplingDepthCm: e.target.value })}
            inputMode="decimal"
            placeholder="0"
          />
        </div>

        <div className="field">
          <label>{t('soil.laboratory')}</label>
          <input value={draft.laboratory} onChange={(e) => onPatch({ laboratory: e.target.value })} />
        </div>

        <div className="field">
          <label>{t('soil.sampleNumber')}</label>
          <input value={draft.sampleNumber} onChange={(e) => onPatch({ sampleNumber: e.target.value })} />
        </div>

        <div className="field">
          <label>{t('soil.status')}</label>
          <select
            value={draft.status}
            onChange={(e) => onPatch({ status: e.target.value as SoilInvestigationStatus })}
          >
            {SOIL_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label>{t('soil.notes')}</label>
          <textarea value={draft.notes} rows={2} onChange={(e) => onPatch({ notes: e.target.value })} />
        </div>

        <div className="field field-full">
          <label>{t('soil.report')}</label>
          <input
            type="file"
            accept=".pdf,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReport(file);
            }}
          />
          {uploading && <span className="limit-hint">…</span>}
          {!uploading && draft.reportPath && <span className="limit-hint">{t('soil.reportAttached')}</span>}
        </div>
      </div>
    </>
  );
}
