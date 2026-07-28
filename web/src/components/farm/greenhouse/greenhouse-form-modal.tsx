import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createGreenhouse, updateGreenhouse, uploadGreenhouseImage } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';

type Props = {
  open: boolean;
  editingItem: Greenhouse | null;
  onClose: () => void;
  onSaved: (greenhouse: Greenhouse, isNew: boolean) => void;
};

export function GreenhouseFormModal({ open, editingItem, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [establishDate, setEstablishDate] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setImageFile(null);
    setImagePreview(null);
    setNameInput(editingItem?.name ?? '');
    setAreaInput(editingItem ? String(editingItem.area) : '');
    setEstablishDate(editingItem?.establishDate ?? null);
    setLocationInput(editingItem?.location ?? '');
    setExistingImagePath(editingItem?.imagePath ?? '');
  }, [open, editingItem]);

  function pickImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;

    setSaving(true);
    setFormError(null);
    try {
      const area = Math.max(0, parseFloat(areaInput) || 0);
      const location = locationInput.trim();
      // Only upload once the rest of the form is known good, so a failed save doesn't leave an
      // orphaned image behind — matching the land form.
      const imagePath = imageFile ? await uploadGreenhouseImage(imageFile) : existingImagePath;

      if (isEditing) {
        const updated: Greenhouse = {
          id: editingItem!.id,
          name: trimmedName,
          imagePath,
          area,
          establishDate,
          location,
          width: editingItem!.width,
          length: editingItem!.length,
          height: editingItem!.height,
        };
        await updateGreenhouse(updated.id, updated);
        onSaved(updated, false);
      } else {
        // Physical dimensions aren't collected here — they're set up later in the Positioning
        // editor, once the greenhouse itself exists.
        const created = await createGreenhouse({
          name: trimmedName,
          imagePath,
          area,
          establishDate,
          location,
          width: 0,
          length: 0,
          height: 0,
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
      <h2 className="form-title">{isEditing ? t('farm.editGreenhouse') : t('farm.addGreenhouse')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t('farm.namePlaceholderGreenhouse')}
          />
        </div>

        <div className="field">
          <label>{t('farm.area')}</label>
          <input
            type="number"
            step="0.01"
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            placeholder={t('farm.areaPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.establishDate')}</label>
          <DateField value={establishDate} max={todayIsoDate()} onChange={setEstablishDate} />
        </div>

        <div className="field">
          <label>{t('farm.location')}</label>
          <input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder={t('farm.locationPlaceholder')}
          />
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
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving || !nameInput.trim()}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
