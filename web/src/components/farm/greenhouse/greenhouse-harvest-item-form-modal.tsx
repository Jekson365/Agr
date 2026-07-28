import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { buildGreenhouseHarvestTargetOptions, greenhouseHarvestTargetKey } from '@/config/greenhouse-harvest-target';
import { STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createGreenhouseHarvestItem, updateGreenhouseHarvestItem } from '@/services/greenhouse-harvest-item-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { GreenhouseHarvestItem } from '@/types/greenhouse-harvest-item';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

type Props = {
  open: boolean;
  greenhouseHarvestId: number;
  greenhouseId: number;
  editingItem: GreenhouseHarvestItem | null;
  /** Crop kinds sown for this harvest (StockKind names, from the seeds used). Only goods of these
   * kinds can be planned — you can't expect a yield from something that was never put in. */
  sownTypes: string[];
  onClose: () => void;
  onSaved: (item: GreenhouseHarvestItem, isNew: boolean) => void;
};

export function GreenhouseHarvestItemFormModal({
  open,
  greenhouseHarvestId,
  greenhouseId,
  editingItem,
  sownTypes,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<GreenhouseStock[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  // A plan can be written in a different unit than the good is stocked in, so it's its own field.
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingItem ? String(editingItem.amount) : '');
    setFormError(null);
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem]);

  async function loadTargets() {
    setTargetsLoading(true);
    try {
      const stockList = await getGreenhouseStock(greenhouseId);

      // A plan can only cover what was actually sown. An existing row's own good stays on the
      // list either way, so editing one recorded before its seed was removed isn't stranded.
      const editingStockId = editingItem?.greenhouseStockId ?? null;
      const allowedStocks = stockList.filter((s) => sownTypes.includes(s.type) || s.id === editingStockId);
      setStocks(allowedStocks);

      const options = buildGreenhouseHarvestTargetOptions(allowedStocks, t);
      const editingKey = editingItem ? greenhouseHarvestTargetKey(editingItem.greenhouseStockId) : null;
      const preset = editingKey && options.some((o) => o.key === editingKey) ? editingKey : (options[0]?.key ?? null);
      setSelectedKey(preset);
      // Keep an edited row's own unit; a new one starts in whatever its good is stocked in.
      setUnit(editingItem?.unit || options.find((o) => o.key === preset)?.unit || '');
    } catch {
      setStocks([]);
      setSelectedKey(null);
      setUnit('');
    } finally {
      setTargetsLoading(false);
    }
  }

  const options = buildGreenhouseHarvestTargetOptions(stocks, t);
  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && selectedOption != null && unit !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = { greenhouseStockId: selectedOption.greenhouseStockId };
      if (isEditing) {
        const updated: GreenhouseHarvestItem = { ...editingItem, ...target, amount, unit };
        await updateGreenhouseHarvestItem(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createGreenhouseHarvestItem({ greenhouseHarvestId, ...target, amount, unit });
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
      <h2 className="form-title">{isEditing ? t('harvestItem.edit') : t('harvestItem.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.stock')}</label>
          {targetsLoading ? (
            <span className="limit-hint">…</span>
          ) : options.length === 0 ? (
            <p className="limit-hint">{sownTypes.length === 0 ? t('harvestItem.sowFirst') : t('harvestItem.noStock')}</p>
          ) : (
            <div className="kind-row">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={selectedKey === option.key ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => {
                    setSelectedKey(option.key);
                    // The offered units change with the good, so fall back to how it's stocked.
                    setUnit(option.unit);
                  }}
                >
                  <img src={option.icon} className="kind-chip-icon" alt="" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="field">
          <label>{t('farm.amount')}</label>
          <input
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
            inputMode="decimal"
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          <div className="kind-row">
            {STOCK_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={unit === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setUnit(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
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
