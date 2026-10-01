import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { LIVESTOCK_MOVEMENT_SOURCE_LABEL_KEY } from '@/config/livestock-movement';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLivestockMovement } from '@/services/livestock-movement-service';
import { LIVESTOCK_MOVEMENT_SOURCES, type LivestockMovementSource } from '@/types/livestock-movement';

type Props = {
  open: boolean;
  livestockId: number;
  onClose: () => void;
  onSaved: () => void;
};

export function MovementFormModal({ open, livestockId, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [quantityInput, setQuantityInput] = useState('1');
  const [source, setSource] = useState<LivestockMovementSource>('Purchase');
  const [date, setDate] = useState(todayIsoDate);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuantityInput('1');
    setSource('Purchase');
    setDate(todayIsoDate());
    setNote('');
    setFormError(null);
  }, [open]);

  async function handleSubmit() {
    const quantity = Math.max(0, parseInt(quantityInput, 10) || 0);
    if (saving || quantity < 1 || !date) return;

    setSaving(true);
    setFormError(null);
    try {
      await createLivestockMovement({
        livestockId,
        delta: quantity,
        source,
        date,
        note: note.trim() || null,
      });
      onClose();
      onSaved();
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t('livestockMovement.tooMany')
          : t('livestockMovement.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('livestockMovement.add')}</h2>

      <div className="modal-form-grid">
        <div className="field">
          <label>{t('livestockMovement.quantity')}</label>
          <input type="number" min={1} value={quantityInput} onChange={(e) => setQuantityInput(e.target.value)} />
        </div>

        <div className="field">
          <label>{t('livestockMovement.source')}</label>
          <select value={source} onChange={(e) => setSource(e.target.value as LivestockMovementSource)}>
            {LIVESTOCK_MOVEMENT_SOURCES.map((option) => (
              <option key={option} value={option}>
                {t(LIVESTOCK_MOVEMENT_SOURCE_LABEL_KEY[option])}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>{t('livestockMovement.date')}</label>
          <DateField value={date} onChange={(value) => setDate(value ?? '')} clearable={false} />
        </div>

        <div className="field">
          <label>{t('livestockMovement.note')}</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('livestockMovement.notePlaceholder')}
          />
        </div>

        {formError && <div className="error-banner field-full">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
          {t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
