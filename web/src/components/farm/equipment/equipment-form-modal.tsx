import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createEquipment, updateEquipment, uploadEquipmentImage } from '@/services/equipment-service';
import type { Equipment } from '@/types/equipment';

type Props = {
  open: boolean;
  editingItem: Equipment | null;
  onClose: () => void;
  onSaved: (item: Equipment, isNew: boolean) => void;
  onDelete: (item: Equipment) => void;
};

export function EquipmentFormModal({ open, editingItem, onClose, onSaved, onDelete }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
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
    setQuantityInput(editingItem ? String(editingItem.quantity) : '');
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
      const quantity = Math.max(0, parseInt(quantityInput, 10) || 0);
      const imagePath = imageFile ? await uploadEquipmentImage(imageFile) : existingImagePath;

      if (isEditing) {
        const updated: Equipment = { id: editingItem!.id, name: trimmedName, quantity, imagePath };
        await updateEquipment(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createEquipment({ name: trimmedName, quantity, imagePath });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('equipment.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('equipment.edit') : t('equipment.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('equipment.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('equipment.namePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('equipment.quantity')}</label>
          <input
            type="number"
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            placeholder={t('equipment.quantityPlaceholder')}
          />
        </div>

        <ImageField
          label={t('equipment.image')}
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

      {isEditing && (
        <button type="button" className="form-delete" onClick={() => onDelete(editingItem!)}>
          {t('common.delete')}
        </button>
      )}
    </Modal>
  );
}
