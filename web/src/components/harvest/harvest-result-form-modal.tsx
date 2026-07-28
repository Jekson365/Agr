import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { buildHarvestTargetOptions, harvestTargetKey } from '@/config/harvest-target';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestResult, updateHarvestResult } from '@/services/harvest-result-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  harvestId: number;
  editingResult: HarvestResult | null;
  /** The harvest's planned items — only used to list those targets first, since they're the
   * likely picks. Anything in stock can be recorded, planned or not. */
  plannedItems: HarvestItem[];
  onClose: () => void;
  onSaved: (result: HarvestResult, isNew: boolean) => void;
};

export function HarvestResultFormModal({ open, harvestId, editingResult, plannedItems, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingResult != null;

  // Initialize the fields, and load which stocks/tree stocks exist to pick from, whenever opened.
  useEffect(() => {
    if (!open) return;
    setAmountInput(editingResult ? String(editingResult.amount) : '');
    setFormError(null);
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingResult]);

  async function loadTargets() {
    setTargetsLoading(true);
    try {
      const [stockList, treeStockList] = await Promise.all([getStock(), getTreeStock()]);
      // Picked fruit is weighed into plant stock, so an orchard isn't a result target. Only a
      // row already pointing at tree stock keeps that option, so it stays editable.
      const editingTreeId = editingResult?.treeStockId ?? null;
      const allowedTreeStocks = treeStockList.filter((s) => s.id === editingTreeId);
      setStocks(stockList);
      setTreeStocks(allowedTreeStocks);

      // What actually came off the field doesn't have to match the plan — a crop can yield
      // something that was never planned, and a harvest may have had no planned items at all.
      // The planned targets just sort to the front as the likely picks.
      const plannedKeys = new Set(plannedItems.map((item) => harvestTargetKey(item.stockId, item.treeStockId)));
      const editingKey = editingResult ? harvestTargetKey(editingResult.stockId, editingResult.treeStockId) : null;

      const options = buildHarvestTargetOptions(stockList, allowedTreeStocks, t);
      const preset =
        editingKey && options.some((o) => o.key === editingKey)
          ? editingKey
          : (options.find((o) => plannedKeys.has(o.key))?.key ?? options[0]?.key ?? null);
      setSelectedKey(preset);
    } catch {
      setStocks([]);
      setTreeStocks([]);
      setSelectedKey(null);
    } finally {
      setTargetsLoading(false);
    }
  }

  const options = buildHarvestTargetOptions(stocks, treeStocks, t);
  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && selectedOption != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = { stockId: selectedOption.stockId, treeStockId: selectedOption.treeStockId };
      if (isEditing) {
        const updated: HarvestResult = { ...editingResult, ...target, amount };
        await updateHarvestResult(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestResult({ harvestId, ...target, amount });
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
      <h2 className="form-title">{isEditing ? t('harvestResult.edit') : t('harvestResult.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.stock')}</label>
          {targetsLoading ? (
            <span className="limit-hint">…</span>
          ) : options.length === 0 ? (
            <p className="limit-hint">{t('harvestItem.noStock')}</p>
          ) : (
            <div className="kind-row">
              {options.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={selectedKey === option.key ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedKey(option.key)}
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
