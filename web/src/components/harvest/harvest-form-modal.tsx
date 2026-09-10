import { useCallback, useEffect, useState } from 'react';

import { HarvestLandFields } from '@/components/harvest/harvest-land-fields';
import { HarvestStatusField } from '@/components/harvest/harvest-status-field';
import { Modal } from '@/components/ui/modal';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { createHarvest, updateHarvest } from '@/services/harvest-service';
import type { Harvest, HarvestKind, HarvestStatus } from '@/types/harvest';

type Props = {
  open: boolean;
  /** New harvests are created under the tab's kind; an existing one keeps its own. */
  kind?: HarvestKind;
  editingHarvest: Harvest | null;
  presetDate?: string;
  onClose: () => void;
  onSaved: (harvest: Harvest, isNew: boolean) => void;
};

export function HarvestFormModal({ open, kind = 'Crop', editingHarvest, presetDate, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [titleInput, setTitleInput] = useState('');
  const [date, setDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [status, setStatus] = useState<HarvestStatus>('Planning');

  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingHarvest != null;

  // Initialize the fields whenever opened.
  useEffect(() => {
    if (!open) return;
    setTitleInput(editingHarvest?.title ?? '');
    setDate(editingHarvest?.date ?? presetDate ?? '');
    setExpectedHarvestDate(editingHarvest?.expectedHarvestDate ?? '');
    setStatus(editingHarvest?.status ?? 'Planning');
    setFormError(null);
  }, [open, editingHarvest, presetDate]);

  const handleLand = useCallback((farmId: number | null, plotId: number | null) => {
    setSelectedFarmId(farmId);
    setSelectedPlotId(plotId);
  }, []);

  const trimmedTitle = titleInput.trim();
  const canSubmit = !!trimmedTitle && !!date && selectedFarmId != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedFarmId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: Harvest = {
          ...editingHarvest,
          title: trimmedTitle,
          date,
          expectedHarvestDate: expectedHarvestDate || null,
          status,
          farmId: selectedFarmId,
          landPlotId: selectedPlotId,
        };
        await updateHarvest(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvest({
          kind,
          title: trimmedTitle,
          date,
          expectedHarvestDate: expectedHarvestDate || null,
          status,
          farmId: selectedFarmId,
          landPlotId: selectedPlotId,
          equipmentCost: null,
          workersCost: null,
          fuelCost: null,
          otherCost: null,
          revenue: null,
        });
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
      <h2 className="form-title">{isEditing ? t('harvest.edit') : t('harvest.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('harvest.titleLabel')}</label>
          <input value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder={t('harvest.titlePlaceholder')} />
        </div>

        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(v) => setDate(v ?? '')} />
        </div>

        <div className="field">
          <label>{t('harvest.expectedDate')}</label>
          <DateField value={expectedHarvestDate} onChange={(v) => setExpectedHarvestDate(v ?? '')} />
          <span className="limit-hint">{t('harvest.expectedDateHint')}</span>
        </div>

        {editingHarvest && <HarvestStatusField harvest={editingHarvest} value={status} onChange={setStatus} />}

        <HarvestLandFields open={open} editingHarvest={editingHarvest} onChange={handleLand} />

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
