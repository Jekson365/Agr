import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { MedicalRecord } from '@/types/medical-record';
import { buildRecordLines } from './medical-record-lines';

type Props = {
  record: MedicalRecord;
  onDelete: (id: number) => void;
};

/** One vet visit: the date and what it was, then whichever details the record carries. */
export function MedicalRecordCard({ record, onDelete }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="record-card">
      <div className="record-card-main">
        <div className="record-card-header">
          <span className="record-card-date">{formatLocalizedIsoDate(record.visitDate, language)}</span>
          <span className="record-card-title">{record.recordType}</span>
        </div>

        {buildRecordLines(record, t, language).map((line, index) => (
          <p key={index} className="record-card-line">
            {line}
          </p>
        ))}
      </div>
      <button
        type="button"
        className="record-card-delete"
        onClick={() => onDelete(record.id)}
        aria-label={t('common.delete')}
      >
        ✕
      </button>
    </div>
  );
}
