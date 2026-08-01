import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { MEDICAL_RECORD_FIELDS } from './medical-record-fields';
import { isFormComplete, type MedicalRecordForm } from './medical-record-form';

type Props = {
  open: boolean;
  form: MedicalRecordForm;
  onFormChange: (form: MedicalRecordForm) => void;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
};

/** The add-visit form. Fully controlled — the view owns the state, since a save has to fold the
 * new record into the list it came from. */
export function MedicalRecordFormModal({ open, form, onFormChange, saving, error, onClose, onSubmit }: Props) {
  const { t } = useLanguage();

  if (!open) return null;

  const canSubmit = isFormComplete(form) && !saving;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{t('medicalRecord.addRecord')}</h2>

        <div className="form-fields">
          {MEDICAL_RECORD_FIELDS.map((field) => (
            <div key={field.key} className="field">
              <label>{t(field.labelKey)}</label>
              {field.kind === 'date' ? (
                <DateField
                  value={form[field.key]}
                  max={field.notFuture ? todayIsoDate() : undefined}
                  onChange={(value) => onFormChange({ ...form, [field.key]: value })}
                />
              ) : (
                <input
                  value={form[field.key]}
                  onChange={(e) => onFormChange({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholderKey ? t(field.placeholderKey) : undefined}
                  inputMode={field.inputMode}
                  autoFocus={field.autoFocus}
                />
              )}
            </div>
          ))}

          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" onClick={onSubmit} disabled={!canSubmit}>
            {t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
