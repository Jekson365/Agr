import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { buildGreenhouseHarvestTargetOptions, greenhouseHarvestTargetKey } from '@/config/greenhouse-harvest-target';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import {
  createGreenhouseHarvestResult,
  getGreenhouseHarvestResults,
  updateGreenhouseHarvestResult,
} from '@/services/greenhouse-harvest-result-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { GreenhouseHarvestItem } from '@/types/greenhouse-harvest-item';
import type { GreenhouseHarvestResult } from '@/types/greenhouse-harvest-result';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

type Props = {
  open: boolean;
  greenhouseHarvestId: number;
  greenhouseId: number;
  editingResult: GreenhouseHarvestResult | null;
  /** The harvest's planned items — only used to list those targets first, since they're the
   * likely picks. Anything in stock can be recorded, planned or not. */
  plannedItems: GreenhouseHarvestItem[];
  /** The results this harvest already has. A good is recorded once — how much of it came off is
   * one number — so the ones already recorded aren't offered again. */
  existingResults: GreenhouseHarvestResult[];
  onClose: () => void;
  onSaved: (result: GreenhouseHarvestResult, isNew: boolean) => void;
};

export function GreenhouseHarvestResultFormModal({
  open,
  greenhouseHarvestId,
  greenhouseId,
  editingResult,
  plannedItems,
  existingResults,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<GreenhouseStock[]>([]);
  /** Set when the greenhouse holds stock but every good of it is already recorded — a different
   *  thing to say than having no stock at all. */
  const [allRecorded, setAllRecorded] = useState(false);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingResult != null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingResult ? String(editingResult.amount) : '');
    setFormError(null);
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingResult]);

  /** The goods a set of results covers — the row being edited aside, since that one is its own
   *  result rather than a clash with it. */
  function idsOf(results: GreenhouseHarvestResult[]): Set<number> {
    return new Set(
      results.filter((result) => result.id !== editingResult?.id).map((result) => result.greenhouseStockId)
    );
  }

  /** The goods this harvest already records, as the page last saw them. */
  function recordedStockIds(): Set<number> {
    return idsOf(existingResults);
  }

  /**
   * What the harvest records now, read back from the server. Used after a refused save: the list
   * this form opened with is by definition out of date then.
   */
  async function reloadRecorded() {
    try {
      const fresh = await getGreenhouseHarvestResults(greenhouseHarvestId);
      loadTargets(idsOf(fresh));
    } catch {
      // Couldn't look — the message already says what happened.
    }
  }

  async function loadTargets(recorded: Set<number> = recordedStockIds()) {
    setTargetsLoading(true);
    try {
      const stockList = await getGreenhouseStock(greenhouseId);

      // A good the harvest already has a result for is off the list — its yield is that one row,
      // and a second would both contradict it and be added to the same balance again. The row
      // being edited keeps its own good, so it can be changed rather than only replaced.
      const selectable = stockList.filter((stock) => !recorded.has(stock.id));
      setStocks(selectable);
      setAllRecorded(stockList.length > 0 && selectable.length === 0);

      // What actually came off the crop doesn't have to match the plan — it can yield something
      // that was never planned, and a harvest may have had no planned items at all. The planned
      // targets just sort to the front as the likely picks.
      const plannedKeys = new Set(plannedItems.map((item) => greenhouseHarvestTargetKey(item.greenhouseStockId)));
      const editingKey = editingResult ? greenhouseHarvestTargetKey(editingResult.greenhouseStockId) : null;

      const options = buildGreenhouseHarvestTargetOptions(selectable, t);
      const preset =
        editingKey && options.some((o) => o.key === editingKey)
          ? editingKey
          : (options.find((o) => plannedKeys.has(o.key))?.key ?? options[0]?.key ?? null);
      setSelectedKey(preset);
    } catch {
      setStocks([]);
      setAllRecorded(false);
      setSelectedKey(null);
    } finally {
      setTargetsLoading(false);
    }
  }

  const options = buildGreenhouseHarvestTargetOptions(stocks, t);
  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && selectedOption != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = { greenhouseStockId: selectedOption.greenhouseStockId };
      if (isEditing) {
        const updated: GreenhouseHarvestResult = { ...editingResult, ...target, amount };
        await updateGreenhouseHarvestResult(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createGreenhouseHarvestResult({ greenhouseHarvestId, ...target, amount });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The picker leaves out the goods already recorded, so a 409 only means one was recorded
      // while this form sat open — reload so it drops off the list here too.
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('harvestResult.alreadyRecorded'));
        reloadRecorded();
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
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
            <p className="limit-hint">{t(allRecorded ? 'harvestResult.allRecorded' : 'harvestItem.noStock')}</p>
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
