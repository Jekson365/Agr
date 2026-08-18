import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { TREE_STOCK_UNIT_OPTIONS } from '@/config/fruit-kinds';
import { buildHarvestTargetOptions, harvestTargetKey } from '@/config/harvest-target';
import { STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestItem, updateHarvestItem } from '@/services/harvest-item-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestItem } from '@/types/harvest-item';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  harvestId: number;
  editingItem: HarvestItem | null;
  /** Crop kinds sown for this harvest (StockKind names, from the seeds used). Only goods of these
   * kinds can be planned — you can't expect a yield from something that was never put in. */
  sownTypes: string[];
  onClose: () => void;
  onSaved: (item: HarvestItem, isNew: boolean) => void;
};

export function HarvestItemFormModal({ open, harvestId, editingItem, sownTypes, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  // A plan can be written in a different unit than the good is stocked in, so it's its own field.
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;

  // Initialize the fields, and load which stocks/tree stocks exist to pick from, whenever opened.
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
      // Removed goods come back too, but only so an existing row that names one keeps naming it
      // (filtered below) — a plan can't be written against a good that is out of use.
      const [stockList, treeStockList] = await Promise.all([getStock(true), getTreeStock(true)]);
      // Yield is measured by weight into plant stock; an orchard is picked, not filled. Only a
      // row already pointing at tree stock keeps that option, so it stays editable.
      const editingTreeId = editingItem?.treeStockId ?? null;
      const allowedTreeStocks = treeStockList.filter((s) => s.id === editingTreeId);

      // A plan can only cover what was actually sown. An existing row's own good stays on the
      // list either way, so editing one recorded before its seed was removed isn't stranded.
      const editingStockId = editingItem?.stockId ?? null;
      const allowedStocks = stockList.filter(
        (s) => (!s.isDeleted && sownTypes.includes(s.type)) || s.id === editingStockId
      );

      setStocks(allowedStocks);
      setTreeStocks(allowedTreeStocks);

      const options = buildHarvestTargetOptions(allowedStocks, allowedTreeStocks, t);
      const editingKey = editingItem ? harvestTargetKey(editingItem.stockId, editingItem.treeStockId) : null;
      const preset = editingKey && options.some((o) => o.key === editingKey) ? editingKey : (options[0]?.key ?? null);
      setSelectedKey(preset);
      // Keep an edited row's own unit; a new one starts in whatever its good is stocked in.
      setUnit(editingItem?.unit || options.find((o) => o.key === preset)?.unit || '');
    } catch {
      setStocks([]);
      setTreeStocks([]);
      setSelectedKey(null);
      setUnit('');
    } finally {
      setTargetsLoading(false);
    }
  }

  const options = buildHarvestTargetOptions(stocks, treeStocks, t);
  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const amount = Math.max(0, parseFloat(amountInput) || 0);
  // Plant stock is weighed or counted; an orchard is counted in trees or boxes. Offer whichever
  // set fits the good being planned against.
  const unitOptions = selectedOption?.treeStockId != null ? TREE_STOCK_UNIT_OPTIONS : STOCK_UNIT_OPTIONS;
  const canSubmit = amount >= 0 && selectedOption != null && unit !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = { stockId: selectedOption.stockId, treeStockId: selectedOption.treeStockId };
      if (isEditing) {
        const updated: HarvestItem = { ...editingItem, ...target, amount, unit };
        await updateHarvestItem(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestItem({ harvestId, ...target, amount, unit });
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
                  {/* Only a row already recorded against it keeps a removed good on this list —
                      say so, or it reads as an ordinary choice. */}
                  {option.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
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
            {unitOptions.map((opt) => (
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
