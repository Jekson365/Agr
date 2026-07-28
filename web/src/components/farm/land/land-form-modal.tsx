import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { Modal } from '@/components/ui/modal';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createFarm, updateFarm, uploadFarmImage } from '@/services/farm-service';
import type { Farm } from '@/types/farm';

type Props = {
  open: boolean;
  editingItem: Farm | null;
  onClose: () => void;
  onSaved: (farm: Farm, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

export function LandFormModal({ open, editingItem, onClose, onSaved, onLimitReached }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
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
      const imagePath = imageFile ? await uploadFarmImage(imageFile) : existingImagePath;

      if (isEditing) {
        const updated: Farm = { id: editingItem!.id, name: trimmedName, imagePath, area, location };
        await updateFarm(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createFarm({ name: trimmedName, imagePath, area, location });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('farm.editFarmland') : t('farm.addFarmland')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('farm.namePlaceholderLand')} />
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
          <label>{t('farm.location')}</label>
          <input value={locationInput} onChange={(e) => setLocationInput(e.target.value)} placeholder={t('farm.locationPlaceholder')} />
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
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
