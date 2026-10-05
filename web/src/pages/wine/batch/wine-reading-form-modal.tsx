import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { READING_FIELDS, type ReadingKey } from '@/config/wine-readings';
import { useLanguage } from '@/contexts/language-context';
import { createWineMeasurement, updateWineMeasurement } from '@/services/wine-measurement-service';
import type { WineMeasurement } from '@/types/wine';

type Props = {
  open: boolean;
  batchId: number;
  editing: WineMeasurement | null;
  onClose: () => void;
  onSaved: () => void;
};

type Inputs = Record<ReadingKey, string>;

const emptyInputs = (): Inputs => ({ sugar: '', temperature: '', alcohol: '', acidity: '', ph: '', freeSo2: '', totalSo2: '' });

export function WineReadingFormModal({ open, batchId, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [date, setDate] = useState(todayIsoDate());
  const [inputs, setInputs] = useState<Inputs>(emptyInputs);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(editing?.date ?? todayIsoDate());
    const next = emptyInputs();
    for (const field of READING_FIELDS) {
      const value = editing?.[field.key];
      next[field.key] = value == null ? '' : String(value);
    }
    setInputs(next);
    setNote(editing?.note ?? '');
    setError(null);
  }, [open, editing]);

  const values = Object.fromEntries(
    READING_FIELDS.map((field) => {
      const raw = inputs[field.key].trim().replace(',', '.');
      return [field.key, raw === '' ? null : Number(raw)];
    })
  ) as Record<ReadingKey, number | null>;
  const outOfRange = READING_FIELDS.some((field) => {
    const value = values[field.key];
    return value != null && (!Number.isFinite(value) || value < field.min || value > field.max);
  });
  const empty = READING_FIELDS.every((field) => values[field.key] == null);

  async function handleSubmit() {
    if (empty || outOfRange || saving) return;
    setSaving(true);
    setError(null);
    try {
      const record = { wineBatchId: batchId, date, ...values, note: note.trim() || null };
      if (editing) {
        await updateWineMeasurement({ ...record, id: editing.id });
      } else {
        await createWineMeasurement(record);
      }
      onSaved();
      onClose();
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{editing ? t('wine.readingEdit') : t('wine.readingAdd')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(value) => setDate(value ?? date)} />
        </div>
        <div className="wine-reading-grid">
          {READING_FIELDS.map((field) => (
            <div key={field.key} className="field">
              <label>{t(field.labelKey)}</label>
              <input
                value={inputs[field.key]}
                inputMode="decimal"
                onChange={(e) => setInputs((prev) => ({ ...prev, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="field">
          <label>{t('wine.notes')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {(error || outOfRange || empty) && (
          <div className={error || outOfRange ? 'error-banner' : 'limit-hint'}>
            {error ?? (outOfRange ? t('wine.readingOutOfRange') : t('wine.readingNeedsValue'))}
          </div>
        )}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={empty || outOfRange || saving}>
          {editing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
