import { useEffect, useState } from 'react';

import '@/components/farm/image-picker.css';
import './stock-photo-history.css';
import { formatLocalizedIsoDate, todayIsoDate } from '@/components/ui/date-utils';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createStockPhoto, deleteStockPhoto, getStockPhotos, uploadStockPhotoImage } from '@/services/stock-photo-service';
import type { StockPhoto } from '@/types/stock-photo';

type Props = {
  stockId: number;
};

type PickedFile = { file: File; previewUrl: string };


/**
 * Photo history for a single stock: a grid of photos each tagged with the date they were taken,
 * plus an "add photo" flow that lets the user pick one or more images and assign them a shared date.
 */
export function StockPhotoHistoryView({ stockId }: Props) {
  const { t, language } = useLanguage();

  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewerPhoto, setViewerPhoto] = useState<StockPhoto | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [picked, setPicked] = useState<PickedFile[]>([]);
  const [takenAt, setTakenAt] = useState(todayIsoDate());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setPhotos(await getStockPhotos(stockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setPicked([]);
    setTakenAt(todayIsoDate());
    setFormError(null);
    setAddOpen(true);
  }

  function pickFiles(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPicked((prev) => [...prev, ...next]);
  }

  function removePicked(previewUrl: string) {
    setPicked((prev) => prev.filter((p) => p.previewUrl !== previewUrl));
  }

  const canSubmit = picked.length > 0 && !!takenAt && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const uploadedPaths = await Promise.all(picked.map((p) => uploadStockPhotoImage(p.file)));
      const created = await Promise.all(uploadedPaths.map((imagePath) => createStockPhoto({ stockId, imagePath, takenAt })));
      setPhotos((prev) => [...created, ...prev].sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)));
      setAddOpen(false);
    } catch {
      setFormError(t('stockPhoto.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteStockPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) {
    return <div className="state-box">…</div>;
  }

  return (
    <>
      {photos.length === 0 ? (
        <p className="empty-state">{t('stockPhoto.empty')}</p>
      ) : (
        <div className="photo-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-card">
              <button type="button" className="photo-card-button" onClick={() => setViewerPhoto(photo)}>
                <img src={resolveAssetUrl(photo.imagePath)} alt="" className="photo-card-image" />
                <div className="photo-card-date">{formatLocalizedIsoDate(photo.takenAt, language)}</div>
              </button>
              <button type="button" className="photo-card-delete" onClick={() => handleDelete(photo.id)} aria-label={t('common.delete')}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{t('stockPhoto.loadError')}</div>}

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('stockPhoto.addPhoto')}
      </button>

      {viewerPhoto && (
        <div className="photo-lightbox-overlay" onClick={() => setViewerPhoto(null)}>
          <button type="button" className="photo-lightbox-close" onClick={() => setViewerPhoto(null)} aria-label={t('common.cancel')}>
            ✕
          </button>
          <img src={resolveAssetUrl(viewerPhoto.imagePath)} alt="" className="photo-lightbox-image" onClick={(e) => e.stopPropagation()} />
          <div className="photo-lightbox-caption">{formatLocalizedIsoDate(viewerPhoto.takenAt, language)}</div>
        </div>
      )}

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">{t('stockPhoto.addPhoto')}</h2>

            <div className="form-fields">
              <div className="field">
                <label>{t('stockPhoto.takenAt')}</label>
                <DateField value={takenAt} max={todayIsoDate()} clearable={false} onChange={(v) => setTakenAt(v ?? '')} />
              </div>

              <div className="field">
                <label>{t('market.image')}</label>
                <div className="photo-picker-row">
                  {picked.map((p) => (
                    <div key={p.previewUrl} className="photo-picker-thumb-wrap">
                      <img src={p.previewUrl} alt="" className="photo-picker-thumb" />
                      <button
                        type="button"
                        className="photo-picker-remove"
                        onClick={() => removePicked(p.previewUrl)}
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
                        pickFiles(e.target.files);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>

              {formError && <div className="error-banner">{formError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
