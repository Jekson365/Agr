import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLandPlot, getUsedTreeStockIds, updateLandPlot } from '@/services/land-plot-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { LandPlot } from '@/types/land-plot';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  farmId: number;
  editingPlot: LandPlot | null;
  onClose: () => void;
  onSaved: (plot: LandPlot, isNew: boolean) => void;
};

export function LandPlotFormModal({ open, farmId, editingPlot, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  /** The fruit entries on offer — the Fruits tab's own rows, minus the planted ones. */
  const [options, setOptions] = useState<TreeStock[]>([]);
  /** Whether the Fruits tab held anything before the planted ones were filtered out — the two
   *  empty states ("none exist yet" and "all of them are planted") need different advice. */
  const [hadAnyFruit, setHadAnyFruit] = useState(false);
  const [fruitsLoading, setFruitsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [areaInput, setAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingPlot != null;

  // Initialize the fields, and load which fruits are free to plant, whenever opened.
  useEffect(() => {
    if (!open) return;
    setAreaInput(editingPlot ? String(editingPlot.area) : '');
    setFormError(null);
    loadFruits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPlot]);

  async function loadFruits() {
    setFruitsLoading(true);
    try {
      const [fruits, used] = await Promise.all([getTreeStock(), getUsedTreeStockIds(farmId)]);
      setHadAnyFruit(fruits.length > 0);

      // A fruit gets one plot per piece of land, so anything this land already grows is off the
      // table — other land may still grow it. The plot being edited doesn't count against itself.
      const taken = new Set(used.filter((id) => id !== editingPlot?.treeStockId));
      const free = fruits.filter((fruit) => !taken.has(fruit.id));

      setOptions(free);
      setSelectedId(pickInitial(free, editingPlot));
    } catch {
      setOptions([]);
      setSelectedId(null);
    } finally {
      setFruitsLoading(false);
    }
  }

  const area = Math.max(0, parseFloat(areaInput) || 0);
  const canSubmit = area > 0 && selectedId != null && !saving;

  async function handleSubmit() {
    const fruit = options.find((option) => option.id === selectedId);
    if (!canSubmit || !fruit) return;

    setSaving(true);
    setFormError(null);
    try {
      // The crop is the fruit's own type; the server re-reads it from the entry either way.
      if (isEditing) {
        const updated: LandPlot = { ...editingPlot, area, crop: fruit.type, treeStockId: fruit.id };
        await updateLandPlot(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLandPlot({ farmId, area, crop: fruit.type, treeStockId: fruit.id });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server refuses a fruit that was planted meanwhile (e.g. from another session).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('landPlot.fruitTaken'));
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('landPlot.edit') : t('landPlot.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.crop')}</label>
          {fruitsLoading ? (
            <div className="kind-row kind-loading">…</div>
          ) : options.length === 0 ? (
            <p className="limit-hint">{t(hadAnyFruit ? 'landPlot.allCropsUsed' : 'landPlot.noCrops')}</p>
          ) : (
            <div className="kind-row">
              {options.map((fruit) => (
                <button
                  key={fruit.id}
                  type="button"
                  className={fruit.id === selectedId ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(fruit.id)}
                >
                  <img src={fruitKindImage(fruit.type)} className="kind-chip-icon" alt="" />
                  <span>{treeStockLabel(fruit, t)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>{t('farm.area')}</label>
          <input
            value={areaInput}
            onChange={(e) => setAreaInput(e.target.value)}
            placeholder={t('farm.areaPlaceholder')}
            inputMode="decimal"
          />
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

/**
 * Which fruit the form opens on: the plot's own, or — for a plot from before plots named a fruit
 * — one of the same kind as the crop it recorded, so editing it doesn't quietly replant it.
 */
function pickInitial(options: TreeStock[], editingPlot: LandPlot | null): number | null {
  if (!editingPlot) return options[0]?.id ?? null;

  const own = options.find((option) => option.id === editingPlot.treeStockId);
  if (own) return own.id;

  const crop = editingPlot.crop.trim().toLowerCase();
  const sameKind = options.find((option) => option.type.trim().toLowerCase() === crop);
  return sameKind?.id ?? null;
}
