import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { LITERS_PER_KG, round2 } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { setProducedLiters } from '@/services/wine-batch-service';
import type { WineBatchSummary } from '@/types/wine';

type Props = {
  open: boolean;
  batch: WineBatchSummary;
  onClose: () => void;
  onSaved: () => void;
};

export function WineLitersModal({ open, batch, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(String(round2(batch.producedLiters)));
    setError(null);
  }, [open, batch.producedLiters]);

  const liters = parseFloat(value);
  const valid = Number.isFinite(liters) && liters >= 0;
  const suggested = round2(batch.grapeKg * LITERS_PER_KG);

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await setProducedLiters(batch.id, liters);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.litersTooLow') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('wine.litersEdit')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('wine.liters')}</label>
          <input value={value} inputMode="decimal" onChange={(e) => setValue(e.target.value)} />
          {batch.grapeKg > 0 && (
            <span className="limit-hint">{t('wine.litersSuggestion', { liters: suggested, ratio: LITERS_PER_KG })}</span>
          )}
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!valid || saving}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
