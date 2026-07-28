import { useEffect, useState } from 'react';

import '@/components/farm/image-picker.css';
import { Modal } from '@/components/ui/modal';
import { LISTING_TYPE_OPTIONS } from '@/config/market-listing';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createMarketListing, updateMarketListing, uploadMarketListingImage } from '@/services/market-listing-service';
import type { ListingCategory, ListingType, MarketListing } from '@/types/market-listing';

/**
 * Seed values for a listing created from somewhere else in the app — e.g. selling a batch of
 * livestock production. `maxQuantity` caps what can be listed, so you can't offer more than the
 * record you started from actually holds.
 */
export type ListingPreset = {
  category: ListingCategory;
  itemType: string;
  title?: string;
  priceUnit?: string;
  price?: number;
  quantity?: number;
  maxQuantity?: number;
};

type Props = {
  open: boolean;
  editingListing: MarketListing | null;
  /** Ignored when editing — an existing listing's own values always win. */
  preset?: ListingPreset | null;
  onClose: () => void;
  onSaved: (listing: MarketListing, isNew: boolean) => void;
};

type PickedFile = { file: File; previewUrl: string };

export function ListingFormModal({ open, editingListing, preset, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [listingType, setListingType] = useState<ListingType>('Sale');
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceUnitInput, setPriceUnitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [newImages, setNewImages] = useState<PickedFile[]>([]);
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingListing != null;

  // Initialize the fields whenever opened.
  useEffect(() => {
    if (!open) return;
    setListingType(editingListing?.type ?? 'Sale');
    setTitleInput(editingListing?.title ?? preset?.title ?? '');
    setDescriptionInput(editingListing?.description ?? '');
    setPriceInput(editingListing ? String(editingListing.price) : preset?.price != null ? String(preset.price) : '');
    setPriceUnitInput(editingListing?.priceUnit ?? preset?.priceUnit ?? '');
    setQuantityInput(
      editingListing?.quantity != null
        ? String(editingListing.quantity)
        : preset?.quantity != null
          ? String(preset.quantity)
          : ''
    );
    setLocationInput(editingListing?.location ?? '');
    setNewImages([]);
    setExistingImagePaths(editingListing?.imagePaths ?? []);
    setFormError(null);
  }, [open, editingListing, preset]);

  function pickImages(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setNewImages((prev) => [...prev, ...next]);
  }

  function removeExistingImage(path: string) {
    setExistingImagePaths((prev) => prev.filter((p) => p !== path));
  }

  function removeNewImage(previewUrl: string) {
    setNewImages((prev) => prev.filter((p) => p.previewUrl !== previewUrl));
  }

  const trimmedTitle = titleInput.trim();
  const price = Math.max(0, parseFloat(priceInput) || 0);
  const quantity = quantityInput.trim() === '' ? null : Math.max(0, parseFloat(quantityInput) || 0);

  // A preset can cap the quantity (you can't list more than the source record holds). The cap
  // only applies to new listings — editing an existing one isn't tied to a source record.
  const maxQuantity = !isEditing ? preset?.maxQuantity : undefined;
  const overMax = maxQuantity != null && quantity != null && quantity > maxQuantity;
  const missingQuantity = maxQuantity != null && (quantity == null || quantity <= 0);

  const canSubmit = price > 0 && trimmedTitle !== '' && !overMax && !missingQuantity && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const uploadedPaths = await Promise.all(newImages.map((p) => uploadMarketListingImage(p.file)));
      const imagePaths = [...existingImagePaths, ...uploadedPaths];
      const payload = {
        type: listingType,
        category: editingListing?.category ?? preset?.category ?? ('Other' as const),
        itemType: editingListing?.itemType ?? preset?.itemType ?? '',
        title: trimmedTitle,
        description: descriptionInput.trim() || null,
        price,
        priceUnit: priceUnitInput.trim(),
        quantity,
        location: locationInput.trim(),
        imagePaths,
      };

      if (isEditing) {
        const updated: MarketListing = { ...editingListing, ...payload };
        await updateMarketListing(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createMarketListing(payload);
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('market.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('market.edit') : t('market.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('market.listingTypeLabel')}</label>
          <div className="kind-row">
            {LISTING_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={listingType === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setListingType(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>{t('market.titleLabel')}</label>
          <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder={t('market.titlePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('market.description')}</label>
          <textarea
            value={descriptionInput}
            onChange={(e) => setDescriptionInput(e.target.value)}
            placeholder={t('market.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('market.price')}</label>
            <input
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder={t('market.pricePlaceholder')}
              inputMode="decimal"
            />
          </div>
          <div className="field">
            <label>{t('market.priceUnit')}</label>
            <input
              value={priceUnitInput}
              onChange={(e) => setPriceUnitInput(e.target.value)}
              placeholder={t('market.priceUnitPlaceholder')}
            />
          </div>
        </div>

        <div className="field">
          <label>{t('market.quantity')}</label>
          <input
            value={quantityInput}
            onChange={(e) => setQuantityInput(e.target.value)}
            placeholder={t('market.quantityPlaceholder')}
            inputMode="decimal"
          />
          {maxQuantity != null && (
            <span className={overMax ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
              {t('market.availableToSell', { amount: maxQuantity, unit: priceUnitInput.trim() })}
            </span>
          )}
        </div>

        <div className="field">
          <label>{t('market.location')}</label>
          <input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder={t('market.locationPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('market.image')}</label>
          <div className="photo-picker-row">
            {existingImagePaths.map((path) => (
              <div key={path} className="photo-picker-thumb-wrap">
                <img src={resolveAssetUrl(path)} alt="" className="photo-picker-thumb" />
                <button
                  type="button"
                  className="photo-picker-remove"
                  onClick={() => removeExistingImage(path)}
                  aria-label={t('common.delete')}
                >
                  ✕
                </button>
              </div>
            ))}
            {newImages.map((p) => (
              <div key={p.previewUrl} className="photo-picker-thumb-wrap">
                <img src={p.previewUrl} alt="" className="photo-picker-thumb" />
                <button
                  type="button"
                  className="photo-picker-remove"
                  onClick={() => removeNewImage(p.previewUrl)}
                  aria-label={t('common.delete')}
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="photo-picker-add">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  pickImages(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        {overMax && <div className="error-banner">{t('market.overAvailable', { amount: maxQuantity ?? 0 })}</div>}
        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
