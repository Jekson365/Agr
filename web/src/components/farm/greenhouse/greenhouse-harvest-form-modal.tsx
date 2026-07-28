import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { createGreenhouseHarvest, updateGreenhouseHarvest } from '@/services/greenhouse-harvest-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { HarvestStatus } from '@/types/harvest';

type Props = {
  open: boolean;
  editingHarvest: GreenhouseHarvest | null;
  /** The greenhouses to harvest from — one must be picked. */
  greenhouses: Greenhouse[];
  onClose: () => void;
  onSaved: (harvest: GreenhouseHarvest, isNew: boolean) => void;
};

export function GreenhouseHarvestFormModal({ open, editingHarvest, greenhouses, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [titleInput, setTitleInput] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [expectedHarvestDate, setExpectedHarvestDate] = useState<string | null>(null);
  const [status, setStatus] = useState<HarvestStatus>('Planning');
  const [greenhouseId, setGreenhouseId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingHarvest != null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setTitleInput(editingHarvest?.title ?? '');
    setDate(editingHarvest?.date.slice(0, 10) ?? todayIsoDate());
    setExpectedHarvestDate(editingHarvest?.expectedHarvestDate?.slice(0, 10) ?? null);
    setStatus(editingHarvest?.status ?? 'Planning');
    setGreenhouseId(editingHarvest?.greenhouseId ?? greenhouses[0]?.id ?? null);
  }, [open, editingHarvest, greenhouses]);

  const canSubmit = titleInput.trim() !== '' && !!date && greenhouseId != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || greenhouseId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const title = titleInput.trim();
      if (isEditing) {
        const updated: GreenhouseHarvest = {
          ...editingHarvest,
          greenhouseId,
          title,
          date,
          status,
          expectedHarvestDate,
        };
        await updateGreenhouseHarvest(updated.id, updated);
        onSaved(updated, false);
      } else {
        // Costs and revenue are recorded later, once the harvest is in.
        const created = await createGreenhouseHarvest({
          greenhouseId,
          title,
          date,
          status,
          expectedHarvestDate,
          equipmentCost: null,
          workersCost: null,
          fuelCost: null,
          otherCost: null,
          revenue: null,
        });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('greenhouse.editHarvest') : t('greenhouse.addHarvest')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.greenhouse')}</label>
          {greenhouses.length === 0 ? (
            <p className="limit-hint">{t('greenhouse.addFirst')}</p>
          ) : (
            <div className="kind-row">
              {greenhouses.map((house) => (
                <button
                  key={house.id}
                  type="button"
                  className={greenhouseId === house.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setGreenhouseId(house.id)}
                >
                  <span>{house.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>{t('harvest.titleLabel')}</label>
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder={t('harvest.titlePlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(v) => setDate(v ?? '')} />
        </div>

        <div className="field">
          <label>{t('harvest.expectedDate')}</label>
          <DateField value={expectedHarvestDate} onChange={setExpectedHarvestDate} />
          <span className="limit-hint">{t('harvest.expectedDateHint')}</span>
        </div>

        {/* A new harvest always starts in Planning, matching the crop harvest form. */}
        {isEditing && (
          <div className="field">
            <label>{t('harvest.statusLabel')}</label>
            <div className="kind-row">
              {HARVEST_STATUSES.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={status === option ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setStatus(option)}
                >
                  <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
