import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { uploadLivestockDetailImage } from '@/services/livestock-detail-service';
import type { BreedingResultInput } from '@/types/breeding-event';
import type { Livestock } from '@/types/livestock';
import type { Gender } from '@/types/livestock-detail';

type Props = {
  open: boolean;
  /** The groups the offspring may join — the parents' own kind, so a chicken pairing cannot put
   *  its chicks in with the cows. */
  groups: Livestock[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: BreedingResultInput) => void;
};

/**
 * What a pairing produced. Reads like the add-animal form because that is what it does — it adds
 * animals — with the two parents settled by the event it was opened from rather than asked for
 * here, and a quantity, since a litter arrives at once.
 */
export function BreedingResultModal({ open, groups, saving, error, onClose, onSubmit }: Props) {
  const { t } = useLanguage();

  const [livestockId, setLivestockId] = useState<number | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [gender, setGender] = useState<Gender | null>(null);
  /** Whether to write down each newborn as its own record, or only count them. */
  const [addIndividuals, setAddIndividuals] = useState(true);
  const [bornDate, setBornDate] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // The group this page belongs to is the likeliest home for its own offspring, and it sorts
    // first among the kind's groups.
    setLivestockId(groups[0]?.id ?? null);
    setQuantityInput('1');
    setGender(null);
    setAddIndividuals(true);
    setBornDate('');
    setImageFile(null);
    setImagePreview(null);
    setUploadError(null);
  }, [open, groups]);

  function pickImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  const quantity = Math.max(0, parseInt(quantityInput, 10) || 0);
  const complete = livestockId != null && quantity > 0;

  async function handleSubmit() {
    if (saving || !complete) return;

    setUploadError(null);
    // Nothing to attach it to when the offspring are only counted.
    let imagePath: string | null = null;
    if (imageFile && addIndividuals) {
      try {
        // Uploaded once and shared by the whole litter: they are photographed together, and one
        // picture per newborn is not what anyone has to hand.
        imagePath = await uploadLivestockDetailImage(imageFile);
      } catch {
        setUploadError(t('breedingEvent.resultImageError'));
        return;
      }
    }

    onSubmit({
      livestockId: livestockId!,
      quantity,
      gender,
      imagePath,
      bornDate: bornDate || null,
      addIndividuals,
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('breedingEvent.resultTitle')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('breedingEvent.resultGroup')}</label>
          <select
            value={livestockId ?? ''}
            onChange={(e) => setLivestockId(e.target.value ? Number(e.target.value) : null)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} · {livestockTypeLabel(group.type, t)}
              </option>
            ))}
          </select>
          <span className="limit-hint">{t('breedingEvent.resultGroupHint')}</span>
        </div>

        <div className="field">
          <label>{t('breedingEvent.resultQuantity')}</label>
          <input
            type="number"
            min={1}
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            placeholder={t('farm.countPlaceholder')}
          />
        </div>

        {/* A result always raises the group's head count. This decides whether each newborn also
            gets a record of its own — which is what per-animal production, parentage and later
            breeding need, but is more than a farmer who does not tag their chicks wants. */}
        <div className="field">
          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={addIndividuals}
              onChange={(e) => setAddIndividuals(e.target.checked)}
            />
            <span>{t('breedingEvent.resultAddIndividuals')}</span>
          </label>
          <span className="limit-hint">{t('breedingEvent.resultAddIndividualsHint')}</span>
        </div>

        {/* Only an animal with a record of its own can carry these. */}
        {addIndividuals && (
          <>
            <div className="field">
              <label>{t('livestockDetail.gender')}</label>
              {/* Optional: newborns are routinely recorded before anyone has sexed them. */}
              <select value={gender ?? ''} onChange={(e) => setGender((e.target.value || null) as Gender | null)}>
                <option value="">{t('breedingEvent.resultGenderUnknown')}</option>
                <option value="Male">{t('livestockDetail.male')}</option>
                <option value="Female">{t('livestockDetail.female')}</option>
              </select>
            </div>

            <div className="field">
              <label>{t('breedingEvent.resultBornDate')}</label>
              <DateField value={bornDate} onChange={(value) => setBornDate(value ?? '')} />
            </div>

            <ImageField
              label={t('farm.image')}
              chooseLabel={t('farm.chooseImage')}
              changeLabel={t('farm.changeImage')}
              previewUrl={imagePreview}
              onPick={pickImage}
            />
          </>
        )}

        {(error || uploadError) && <div className="error-banner">{error ?? uploadError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving || !complete}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
