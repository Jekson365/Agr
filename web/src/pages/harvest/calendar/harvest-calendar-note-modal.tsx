import { useEffect, useState } from 'react';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { createCalendarEvent, deleteCalendarEvent } from '@/services/calendar-service';
import type { CalendarEvent } from '@/types/calendar';

type Props = {
  open: boolean;
  date: string;
  time: string;
  editingNote: CalendarEvent | null;
  onClose: () => void;
  onSaved: (note: CalendarEvent) => void;
  onDeleted: (id: number) => void;
};

export function HarvestCalendarNoteModal({
  open,
  date,
  time,
  editingNote,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const { t, language } = useLanguage();

  const [title, setTitle] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(editingNote?.title ?? '');
    setTimeInput((editingNote?.time ?? time).slice(0, 5));
    setFormError(null);
  }, [open, editingNote, time]);

  async function handleSave() {
    const trimmed = title.trim();
    if (saving || trimmed === '') return;

    setSaving(true);
    setFormError(null);
    try {
      const saved = await createCalendarEvent({ title: trimmed, date, time: timeInput || '00:00' });
      onSaved(saved);
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (saving || !editingNote) return;
    setSaving(true);
    setFormError(null);
    try {
      await deleteCalendarEvent(editingNote.id);
      onDeleted(editingNote.id);
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvestCalendar.noteHeading')}</h2>
      <p className="harvest-calendar-note-date">{formatLocalizedIsoDate(date, language)}</p>

      {formError && <div className="error-banner">{formError}</div>}

      <div className="form-fields">
        <div className="field">
          <label>{t('harvestCalendar.noteLabel')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('harvestCalendar.notePlaceholder')}
            disabled={editingNote != null}
          />
        </div>

        <div className="field">
          <label>{t('harvestCalendar.noteTime')}</label>
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
            disabled={editingNote != null}
          />
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {editingNote ? (
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
            {t('common.delete')}
          </button>
        ) : (
          <button type="button" className="btn" onClick={handleSave} disabled={saving || title.trim() === ''}>
            {t('common.save')}
          </button>
        )}
      </div>
    </Modal>
  );
}
