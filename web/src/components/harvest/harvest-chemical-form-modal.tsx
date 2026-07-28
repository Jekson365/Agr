import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestChemical, updateHarvestChemical } from '@/services/harvest-chemical-service';
import type { HarvestChemical } from '@/types/harvest-chemical';

type Props = {
  open: boolean;
  harvestId: number;
  editingChemical: HarvestChemical | null;
  onClose: () => void;
  onSaved: (chemical: HarvestChemical, isNew: boolean) => void;
};

/** Records a chemical applied to a harvest — its name, date, and cost. */
export function HarvestChemicalFormModal({ open, harvestId, editingChemical, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [costInput, setCostInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingChemical != null;

  useEffect(() => {
    if (!open) return;
    setName(editingChemical?.name ?? '');
    setDate(editingChemical?.date?.slice(0, 10) ?? todayIsoDate());
    setCostInput(editingChemical != null ? String(editingChemical.cost) : '');
    setFormError(null);
  }, [open, editingChemical]);

  const cost = Math.max(0, parseFloat(costInput) || 0);
  const canSubmit = name.trim().length > 0 && date != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || date == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: HarvestChemical = { ...editingChemical, name: name.trim(), date, cost };
        await updateHarvestChemical(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestChemical({ harvestId, name: name.trim(), date, cost });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('harvestChemical.edit') : t('harvestChemical.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('harvestChemical.name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('harvestChemical.namePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('harvestChemical.date')}</label>
          <DateField value={date} max={todayIsoDate()} onChange={setDate} />
        </div>

        <div className="field">
          <label>{t('harvestChemical.cost')}</label>
          <input value={costInput} onChange={(e) => setCostInput(e.target.value)} placeholder="0" inputMode="decimal" />
        </div>

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
