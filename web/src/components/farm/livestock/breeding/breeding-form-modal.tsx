import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { BREEDING_STATUSES, type BreedingStatus } from '@/types/breeding-event';
import type { LivestockDetail } from '@/types/livestock-detail';

/**
 * An animal offered in one of the two pickers, with the group it belongs to for context and that
 * group's kind — which is what decides whether it may appear at all, since a pairing only makes
 * sense between two of the same animal.
 */
export type AnimalOption = { detail: LivestockDetail; groupName: string; groupType: string };

export type BreedingForm = {
  maleAnimalId: number | null;
  femaleAnimalId: number | null;
  breedingDate: string;
  comment: string;
  status: BreedingStatus;
};

export const BREEDING_STATUS_LABEL_KEY: Record<BreedingStatus, string> = {
  Breeding: 'breedingEvent.statusBreeding',
  PregnancyConfirmed: 'breedingEvent.statusPregnancyConfirmed',
  Completed: 'breedingEvent.statusCompleted',
  Failed: 'breedingEvent.statusFailed',
};

type Props = {
  open: boolean;
  isEditing: boolean;
  form: BreedingForm;
  males: AnimalOption[];
  females: AnimalOption[];
  saving: boolean;
  error: string | null;
  onFormChange: (form: BreedingForm) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function BreedingFormModal({
  open,
  isEditing,
  form,
  males,
  females,
  saving,
  error,
  onFormChange,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLanguage();

  // The pair is the whole point of the record, so neither side may be left empty. The date is
  // always filled — it opens on today — and the comment is optional.
  const complete = form.maleAnimalId != null && form.femaleAnimalId != null && !!form.breedingDate;

  function animalLabel({ detail, groupName }: AnimalOption): string {
    return `${detail.code} · ${groupName}`;
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('breedingEvent.edit') : t('breedingEvent.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('breedingEvent.male')}</label>
          <select
            value={form.maleAnimalId ?? ''}
            onChange={(e) => onFormChange({ ...form, maleAnimalId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t('breedingEvent.selectAnimal')}</option>
            {males.map((option) => (
              <option key={option.detail.id} value={option.detail.id}>
                {animalLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t('breedingEvent.female')}</label>
          <select
            value={form.femaleAnimalId ?? ''}
            onChange={(e) => onFormChange({ ...form, femaleAnimalId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t('breedingEvent.selectAnimal')}</option>
            {females.map((option) => (
              <option key={option.detail.id} value={option.detail.id}>
                {animalLabel(option)}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t('breedingEvent.breedingDate')}</label>
          <DateField
            value={form.breedingDate}
            onChange={(value) => onFormChange({ ...form, breedingDate: value ?? '' })}
            clearable={false}
          />
        </div>

        {/* Only the stage is chosen here. The date each stage was reached is the server's, stamped
            as the event arrives at it — see BreedingEventsController.StampStageDate. */}
        <div className="field">
          <label>{t('breedingEvent.status')}</label>
          <select
            value={form.status}
            onChange={(e) => onFormChange({ ...form, status: e.target.value as BreedingStatus })}
          >
            {BREEDING_STATUSES.map((status) => (
              <option key={status} value={status}>
                {t(BREEDING_STATUS_LABEL_KEY[status])}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t('breedingEvent.comment')}</label>
          <input
            value={form.comment}
            onChange={(e) => onFormChange({ ...form, comment: e.target.value })}
            placeholder={t('breedingEvent.commentPlaceholder')}
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="form-actions">
        <button type="button" className="retry-button" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="add-button" onClick={onSubmit} disabled={saving || !complete}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
