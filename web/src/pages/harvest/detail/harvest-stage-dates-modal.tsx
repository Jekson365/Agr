import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { updateHarvestStatusChange } from '@/services/harvest-status-change-service';
import type { HarvestStatusChange } from '@/types/harvest-status-change';

type Props = {
  open: boolean;
  changes: HarvestStatusChange[];
  onClose: () => void;
  onSaved: (changes: HarvestStatusChange[]) => void;
};

export function HarvestStageDatesModal({ open, changes, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDrafts(Object.fromEntries(changes.map((change) => [change.id, change.date])));
    setError(null);
  }, [open, changes]);

  async function handleSave() {
    const edited = changes.filter((change) => drafts[change.id] && drafts[change.id] !== change.date);
    if (edited.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = edited.map((change) => ({ ...change, date: drafts[change.id] }));
      await Promise.all(saved.map((change) => updateHarvestStatusChange(change.id, change)));
      const byId = new Map(saved.map((change) => [change.id, change]));
      onSaved(changes.map((change) => byId.get(change.id) ?? change));
      onClose();
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvest.stageDatesTitle')}</h2>
      <p className="limit-hint">{t('harvest.stageDatesHint')}</p>

      <div className="form-fields">
        {changes.map((change) => (
          <div key={change.id} className="field">
            <label>{t(HARVEST_STATUS_LABEL_KEY[change.toStatus])}</label>
            <DateField
              value={drafts[change.id] ?? change.date}
              clearable={false}
              disabled={saving}
              onChange={(value) => setDrafts((prev) => ({ ...prev, [change.id]: value ?? change.date }))}
            />
          </div>
        ))}

        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={saving}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
