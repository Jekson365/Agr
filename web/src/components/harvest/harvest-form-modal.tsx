import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { cropLabel } from '@/config/crop';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { createHarvest, updateHarvest } from '@/services/harvest-service';
import { getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { Harvest, HarvestKind, HarvestStatus } from '@/types/harvest';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  open: boolean;
  /** New harvests are created under the tab's kind; an existing one keeps its own. */
  kind?: HarvestKind;
  editingHarvest: Harvest | null;
  onClose: () => void;
  onSaved: (harvest: Harvest, isNew: boolean) => void;
};

function plotLabel(plot: LandPlot, t: (key: string) => string): string {
  return `${cropLabel(plot.crop, t)} · ${plot.area} ${t('farm.areaUnit')}`;
}

export function HarvestFormModal({ open, kind = 'Crop', editingHarvest, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [titleInput, setTitleInput] = useState('');
  const [date, setDate] = useState('');
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [status, setStatus] = useState<HarvestStatus>('Planning');

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingHarvest != null;

  // Initialize the fields, and load which farms/plots exist to pick from, whenever opened.
  useEffect(() => {
    if (!open) return;
    setTitleInput(editingHarvest?.title ?? '');
    setDate(editingHarvest?.date ?? '');
    setExpectedHarvestDate(editingHarvest?.expectedHarvestDate ?? '');
    setStatus(editingHarvest?.status ?? 'Planning');
    setFormError(null);
    initializeLand();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingHarvest]);

  async function initializeLand() {
    setFarmsLoading(true);
    try {
      const farmList = await getFarms();
      setFarms(farmList);

      const farmId = editingHarvest?.farmId ?? farmList[0]?.id ?? null;
      setSelectedFarmId(farmId);

      // The plot picker only appears when editing, so only bother fetching plots then.
      if (editingHarvest != null) {
        await loadPlots(farmId, editingHarvest.landPlotId);
      } else {
        setPlots([]);
        setSelectedPlotId(null);
      }
    } catch {
      setFarms([]);
      setSelectedFarmId(null);
      setPlots([]);
      setSelectedPlotId(null);
    } finally {
      setFarmsLoading(false);
    }
  }

  async function loadPlots(farmId: number | null, presetPlotId?: number | null) {
    if (farmId == null) {
      setPlots([]);
      setSelectedPlotId(null);
      return;
    }

    setPlotsLoading(true);
    try {
      const plotList = await getLandPlots(farmId);
      setPlots(plotList);
      const preset =
        presetPlotId != null && plotList.some((p) => p.id === presetPlotId) ? presetPlotId : (plotList[0]?.id ?? null);
      setSelectedPlotId(preset);
    } catch {
      setPlots([]);
      setSelectedPlotId(null);
    } finally {
      setPlotsLoading(false);
    }
  }

  function handleSelectFarm(farmId: number) {
    setSelectedFarmId(farmId);
    if (isEditing) {
      loadPlots(farmId);
    }
  }

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
          landPlotId: null,
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

        <div className="field">
          <label>{t('harvest.landLabel')}</label>
          {farmsLoading ? (
            <span className="limit-hint">…</span>
          ) : farms.length === 0 ? (
            <p className="limit-hint">{t('harvest.noFarms')}</p>
          ) : (
            <select value={selectedFarmId ?? ''} onChange={(e) => handleSelectFarm(Number(e.target.value))}>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isEditing && farms.length > 0 && (
          <div className="field">
            <label>{t('harvest.plotLabel')}</label>
            {plotsLoading ? (
              <span className="limit-hint">…</span>
            ) : plots.length === 0 ? (
              <p className="limit-hint">{t('harvest.noPlots')}</p>
            ) : (
              <select value={selectedPlotId ?? ''} onChange={(e) => setSelectedPlotId(Number(e.target.value))}>
                {plots.map((plot) => (
                  <option key={plot.id} value={plot.id}>
                    {plotLabel(plot, t)}
                  </option>
                ))}
              </select>
            )}
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
