import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { Modal } from '@/components/ui/modal';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  createLivestockDetail,
  updateLivestockDetail,
  uploadLivestockDetailImage,
} from '@/services/livestock-detail-service';
import type { Gender, LivestockDetail } from '@/types/livestock-detail';

const GENDER_OPTIONS: { value: Gender; labelKey: string }[] = [
  { value: 'Male', labelKey: 'livestockDetail.male' },
  { value: 'Female', labelKey: 'livestockDetail.female' },
];

type Props = {
  open: boolean;
  livestockId: number;
  editingDetail: LivestockDetail | null;
  onClose: () => void;
  onSaved: (detail: LivestockDetail, isNew: boolean) => void;
};

export function LivestockDetailFormModal({ open, livestockId, editingDetail, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [codeInput, setCodeInput] = useState('');
  const [bornDate, setBornDate] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingDetail != null;

  useEffect(() => {
    if (!open) return;
    setCodeInput(editingDetail?.code ?? '');
    setBornDate(editingDetail?.bornDate ?? null);
    setGender(editingDetail?.gender ?? null);
    setExistingImagePath(editingDetail?.imagePath ?? '');
    setImageFile(null);
    setImagePreview(null);
    setFormError(null);
  }, [open, editingDetail]);

  function pickImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const trimmedCode = codeInput.trim();
    if (!trimmedCode) return;

    setSaving(true);
    setFormError(null);
    try {
      const imagePath = imageFile ? await uploadLivestockDetailImage(imageFile) : existingImagePath;

      if (isEditing) {
        const updated: LivestockDetail = { ...editingDetail, code: trimmedCode, imagePath, bornDate, gender };
        await updateLivestockDetail(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestockDetail({
          livestockId,
          code: trimmedCode,
          imagePath,
          bornDate,
          gender,
          // An animal entered by hand has no recorded parentage. Only a breeding result carries
          // it, and that goes through its own endpoint.
          parentOneId: null,
          parentTwoId: null,
        });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('livestockDetail.edit') : t('livestockDetail.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('livestockDetail.code')}</label>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder={t('livestockDetail.codePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('livestockDetail.bornDate')}</label>
          <DateField value={bornDate} max={todayIsoDate()} onChange={setBornDate} />
        </div>

        <div className="field">
          <label>{t('livestockDetail.gender')}</label>
          <div className="kind-row">
            {GENDER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={gender === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setGender(gender === opt.value ? null : opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <ImageField
          label={t('farm.image')}
          chooseLabel={t('farm.chooseImage')}
          changeLabel={t('farm.changeImage')}
          previewUrl={imagePreview ?? (existingImagePath ? resolveAssetUrl(existingImagePath) : null)}
          onPick={pickImage}
        />

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving || !codeInput.trim()}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
