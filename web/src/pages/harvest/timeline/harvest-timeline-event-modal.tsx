import { useEffect, useState } from 'react';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestEvent, deleteHarvestEvent } from '@/services/harvest-event-service';
import type { HarvestEvent } from '@/types/harvest-event';
import './harvest-timeline-event-modal.css';

type Props = {
  open: boolean;
  harvestId: number;
  harvestTitle: string;
  date: string;
  events: HarvestEvent[];
  onClose: () => void;
  onSaved: (event: HarvestEvent) => void;
  onDeleted: (id: number) => void;
};

export function HarvestTimelineEventModal({
  open,
  harvestId,
  harvestTitle,
  date,
  events,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { t, language } = useLanguage();

  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDescription('');
    setFormError(null);
  }, [open, date]);

  async function handleSave() {
    const trimmed = description.trim();
    if (saving || trimmed === '') return;

    setSaving(true);
    setFormError(null);
    try {
      onSaved(await createHarvestEvent({ harvestId, date, description: trimmed }));
      setDescription('');
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      await deleteHarvestEvent(id);
      onDeleted(id);
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvestTimeline.eventHeading')}</h2>
      <p className="hcal-event-meta">
        {harvestTitle} · {formatLocalizedIsoDate(date, language)}
      </p>

      {formError && <div className="error-banner">{formError}</div>}

      {events.length > 0 && (
        <ul className="hcal-event-list">
          {events.map((event) => (
            <li key={event.id} className="hcal-event-row">
              <span className="hcal-event-text">{event.description}</span>
              <button
                type="button"
                className="hcal-event-remove"
                disabled={saving}
                onClick={() => handleDelete(event.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="form-fields">
        <div className="field">
          <label>{t('harvestTimeline.eventLabel')}</label>
          <textarea
            className="hcal-event-input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('harvestTimeline.eventPlaceholder')}
          />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
        <button type="button" className="btn" disabled={saving || description.trim() === ''} onClick={handleSave}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
