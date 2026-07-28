import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import { cropImage, cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { createLandPlot, updateLandPlot } from '@/services/land-plot-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  open: boolean;
  farmId: number;
  editingPlot: LandPlot | null;
  onClose: () => void;
  onSaved: (plot: LandPlot, isNew: boolean) => void;
};

// One selectable row in the crop picker. Ordinarily one per stock or tree stock item (so items
// that share a type but have different custom names show up separately) — see loadCrops for the
// one case where a row doesn't back onto a real item.
type CropOption = {
  key: string;
  type: string;
  name: string;
};

export function LandPlotFormModal({ open, farmId, editingPlot, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [options, setOptions] = useState<CropOption[]>([]);
  const [cropsLoading, setCropsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [areaInput, setAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingPlot != null;

  // Initialize the fields, and load which stock/tree stock items currently exist, whenever opened.
  useEffect(() => {
    if (!open) return;
    setAreaInput(editingPlot ? String(editingPlot.area) : '');
    setFormError(null);
    loadCrops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPlot]);

  async function loadCrops() {
    setCropsLoading(true);
    try {
      const [stocks, treeStocks] = await Promise.all([getStock(), getTreeStock()]);
      const opts: CropOption[] = [
        ...stocks.map((s) => ({ key: `stock:${s.id}`, type: s.type, name: s.name })),
        ...treeStocks.map((s) => ({ key: `tree:${s.id}`, type: s.type, name: s.name })),
      ];

      // Always keep the plot's own crop type selectable — labeled generically — even if every
      // stock/tree stock item of that type was since removed from its tab.
      const editingCrop = editingPlot?.crop;
      if (editingCrop && !opts.some((o) => o.type === editingCrop)) {
        opts.push({ key: `type:${editingCrop}`, type: editingCrop, name: '' });
      }

      setOptions(opts);
      const matching = editingCrop ? opts.find((o) => o.type === editingCrop) : undefined;
      setSelectedKey(matching ? matching.key : (opts[0]?.key ?? null));
    } catch {
      setOptions([]);
      setSelectedKey(null);
    } finally {
      setCropsLoading(false);
    }
  }

  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const area = Math.max(0, parseFloat(areaInput) || 0);
  const canSubmit = area > 0 && selectedOption != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: LandPlot = { ...editingPlot, area, crop: selectedOption.type };
        await updateLandPlot(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLandPlot({ farmId, area, crop: selectedOption.type });
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
      <h2 className="form-title">{isEditing ? t('landPlot.edit') : t('landPlot.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.crop')}</label>
          {cropsLoading ? (
            <div className="kind-row kind-loading">…</div>
          ) : options.length === 0 ? (
            <p className="limit-hint">{t('landPlot.noCrops')}</p>
          ) : (
            <div className="kind-row">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={option.key === selectedKey ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedKey(option.key)}
                >
                  <img src={cropImage(option.type)} className="kind-chip-icon" alt="" />
                  <span>{option.name.trim() || cropLabel(option.type, t)}</span>
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
