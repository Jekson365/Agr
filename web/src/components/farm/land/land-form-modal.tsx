import { useEffect, useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { TerritoryMap } from '@/components/farm/land/territory-map';
import { TerritoryModal } from '@/components/farm/land/territory-modal';
import { Modal } from '@/components/ui/modal';
import { isPlanLimitError } from '@/config/plan-benefits';
import {
  formatArea,
  parseTerritory,
  serializeTerritory,
  territoryAreaHectares,
  type TerritoryPoint,
} from '@/config/territory';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createFarm, updateFarm, uploadFarmImage } from '@/services/farm-service';
import type { Farm } from '@/types/farm';

import './land-form.css';
import './territory-field.css';

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
  const { user } = useAuth();

  const [nameInput, setNameInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [territory, setTerritory] = useState<TerritoryPoint[]>([]);
  const [mapOpen, setMapOpen] = useState(false);
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
    setTerritory(parseTerritory(editingItem?.boundary));
  }, [open, editingItem]);

  function pickImage(file: File) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  /** Where the map opens when this land has no territory yet — the owner's own saved location,
   *  which is a far better guess than the middle of the country. */
  const mapCenter =
    user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null;

  const territoryArea = territoryAreaHectares(territory);

  function handleTerritorySaved(points: TerritoryPoint[]) {
    setTerritory(points);
    setMapOpen(false);
    // A drawn territory already answers "how big is it", so fill the area in when nothing was
    // typed there. An area the owner entered themselves is left alone — they can still take the
    // measured one from the button next to it.
    const measured = territoryAreaHectares(points);
    if (measured > 0 && (parseFloat(areaInput) || 0) === 0) {
      setAreaInput(formatArea(measured));
    }
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
      const boundary = serializeTerritory(territory);

      if (isEditing) {
        // isRemoved is carried through rather than rebuilt: the form never sets it, and the server
        // ignores it on update — putting land back is its own call.
        const updated: Farm = { ...editingItem!, name: trimmedName, imagePath, area, location, boundary };
        await updateFarm(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createFarm({ name: trimmedName, imagePath, area, location, boundary });
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
    /* The map editor is a sibling of the form rather than a child of it: nested inside, a click on
       its backdrop would bubble on to the form's own backdrop and close both at once. */
    <>
      <Modal open={open} onClose={onClose} className="land-form-modal">
        <h2 className="form-title">{isEditing ? t('farm.editFarmland') : t('farm.addFarmland')}</h2>

        <div className="form-fields modal-form-grid">
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

          <div className="field field-wide">
            <label>{t('landTerritory.label')}</label>
            {territory.length > 0 ? (
              <div className="territory-field">
                {/* A still picture of what was marked. Reshaping it happens in the full-screen map,
                    so the preview itself takes no clicks (see .territory-field-preview). */}
                <div className="territory-field-preview">
                  <TerritoryMap points={territory} fallbackCenter={mapCenter} />
                </div>
                <div className="territory-field-meta">
                  <span>{t('landTerritory.corners', { count: territory.length })}</span>
                  {territoryArea > 0 && (
                    <button
                      type="button"
                      className="territory-field-area"
                      onClick={() => setAreaInput(formatArea(territoryArea))}
                      title={t('landTerritory.useArea')}
                    >
                      ≈ {formatArea(territoryArea)} {t('farm.areaUnit')}
                    </button>
                  )}
                  <span className="territory-field-spacer" />
                  <button type="button" className="territory-field-link" onClick={() => setMapOpen(true)}>
                    {t('landTerritory.edit')}
                  </button>
                  <button type="button" className="territory-field-link danger" onClick={() => setTerritory([])}>
                    {t('landTerritory.clear')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="territory-field-empty" onClick={() => setMapOpen(true)}>
                {t('landTerritory.mark')}
              </button>
            )}
          </div>

          <ImageField
            label={t('farm.image')}
            chooseLabel={t('farm.chooseImage')}
            changeLabel={t('farm.changeImage')}
            previewUrl={imagePreview ?? (existingImagePath ? resolveAssetUrl(existingImagePath) : null)}
            onPick={pickImage}
          />

          {formError && <div className="error-banner field-full">{formError}</div>}
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

      <TerritoryModal
        open={mapOpen}
        points={territory}
        exceptFarmId={editingItem?.id ?? null}
        fallbackCenter={mapCenter}
        onClose={() => setMapOpen(false)}
        onSave={handleTerritorySaved}
      />
    </>
  );
}
