import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import {
  createLandPlot,
  getUsedStockIds,
  getUsedTreeStockIds,
  updateLandPlot,
} from '@/services/land-plot-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { LandPlot } from '@/types/land-plot';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  farmId: number;
  editingPlot: LandPlot | null;
  onClose: () => void;
  onSaved: (plot: LandPlot, isNew: boolean) => void;
};

/** What a plot grows: one entry from the Fruits list, or one from the Stock list — never both,
 *  since the area a plot records answers for that single entry. */
type CropChoice = { kind: 'fruit' | 'stock'; id: number };

export function LandPlotFormModal({ open, farmId, editingPlot, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  /** The entries on offer — each tab's own rows, minus the ones this land already grows. */
  const [fruitOptions, setFruitOptions] = useState<TreeStock[]>([]);
  const [stockOptions, setStockOptions] = useState<Stock[]>([]);
  /** Whether either tab held anything before the planted ones were filtered out — the two empty
   *  states ("none exist yet" and "all of them are planted") need different advice. */
  const [hadAny, setHadAny] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [choice, setChoice] = useState<CropChoice | null>(null);
  const [areaInput, setAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingPlot != null;

  // Initialize the fields, and load what is free to plant, whenever opened.
  useEffect(() => {
    if (!open) return;
    setAreaInput(editingPlot ? String(editingPlot.area) : '');
    setFormError(null);
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPlot]);

  async function loadOptions() {
    setOptionsLoading(true);
    try {
      const [fruits, usedFruits, stocks, usedStocks] = await Promise.all([
        getTreeStock(),
        getUsedTreeStockIds(farmId),
        getStock(),
        getUsedStockIds(farmId),
      ]);
      setHadAny(fruits.length > 0 || stocks.length > 0);

      // An entry gets one plot per piece of land, so anything this land already grows is off the
      // table — other land may still grow it. The plot being edited doesn't count against itself.
      const takenFruits = new Set(usedFruits.filter((id) => id !== editingPlot?.treeStockId));
      const freeFruits = fruits.filter((fruit) => !takenFruits.has(fruit.id));

      const takenStocks = new Set(usedStocks.filter((id) => id !== editingPlot?.stockId));
      const freeStocks = stocks.filter((stock) => !takenStocks.has(stock.id));

      setFruitOptions(freeFruits);
      setStockOptions(freeStocks);
      setChoice(pickInitial(freeFruits, freeStocks, editingPlot));
    } catch {
      setFruitOptions([]);
      setStockOptions([]);
      setChoice(null);
    } finally {
      setOptionsLoading(false);
    }
  }

  /** The picked entry as the fields a plot stores. Null when the selection no longer resolves. */
  function selectedCrop() {
    if (!choice) return null;

    if (choice.kind === 'fruit') {
      const fruit = fruitOptions.find((option) => option.id === choice.id);
      return fruit ? { crop: fruit.type, treeStockId: fruit.id, stockId: null } : null;
    }

    const stock = stockOptions.find((option) => option.id === choice.id);
    return stock ? { crop: stock.type, treeStockId: null, stockId: stock.id } : null;
  }

  const area = Math.max(0, parseFloat(areaInput) || 0);
  const hasOptions = fruitOptions.length > 0 || stockOptions.length > 0;
  const canSubmit = area > 0 && choice != null && !saving;

  function isPicked(kind: CropChoice['kind'], id: number): boolean {
    return choice?.kind === kind && choice.id === id;
  }

  async function handleSubmit() {
    const picked = selectedCrop();
    if (!canSubmit || !picked) return;

    setSaving(true);
    setFormError(null);
    try {
      // The crop is the entry's own type; the server re-reads it from the entry either way.
      if (isEditing) {
        const updated: LandPlot = { ...editingPlot, area, ...picked };
        await updateLandPlot(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLandPlot({ farmId, area, ...picked });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server refuses an entry that was planted meanwhile (e.g. from another session).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t(choice?.kind === 'stock' ? 'landPlot.stockTaken' : 'landPlot.fruitTaken'));
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
          {optionsLoading ? (
            <div className="kind-row kind-loading">…</div>
          ) : !hasOptions ? (
            <p className="limit-hint">{t(hadAny ? 'landPlot.allCropsUsed' : 'landPlot.noCrops')}</p>
          ) : (
            <>
              {/* Grouped by which list an entry came from — an apple orchard and a field of
                  tomatoes are both "what grows here", but they are picked from different tabs. */}
              {fruitOptions.length > 0 && (
                <>
                  <span className="kind-group-label">{t('farm.fruits')}</span>
                  <div className="kind-row">
                    {fruitOptions.map((fruit) => (
                      <button
                        key={fruit.id}
                        type="button"
                        className={isPicked('fruit', fruit.id) ? 'kind-chip active' : 'kind-chip'}
                        onClick={() => setChoice({ kind: 'fruit', id: fruit.id })}
                      >
                        <img src={fruitKindImage(fruit.type)} className="kind-chip-icon" alt="" />
                        <span>{treeStockLabel(fruit, t)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {stockOptions.length > 0 && (
                <>
                  <span className="kind-group-label">{t('farm.stock')}</span>
                  <div className="kind-row">
                    {stockOptions.map((stock) => (
                      <button
                        key={stock.id}
                        type="button"
                        className={isPicked('stock', stock.id) ? 'kind-chip active' : 'kind-chip'}
                        onClick={() => setChoice({ kind: 'stock', id: stock.id })}
                      >
                        <img src={stockKindImage(stock.type)} className="kind-chip-icon" alt="" />
                        <span>{stock.name.trim() || stockTypeLabel(stock.type, t)}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
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
 * Which entry the form opens on: the plot's own fruit or stock, or — for a plot from before plots
 * named one — an entry of the same kind as the crop it recorded, so editing it doesn't quietly
 * replant it. Fruits are checked first, matching the order they are offered in.
 */
function pickInitial(
  fruits: TreeStock[],
  stocks: Stock[],
  editingPlot: LandPlot | null,
): CropChoice | null {
  if (!editingPlot) {
    if (fruits.length > 0) return { kind: 'fruit', id: fruits[0].id };
    return stocks.length > 0 ? { kind: 'stock', id: stocks[0].id } : null;
  }

  const ownFruit = fruits.find((option) => option.id === editingPlot.treeStockId);
  if (ownFruit) return { kind: 'fruit', id: ownFruit.id };

  const ownStock = stocks.find((option) => option.id === editingPlot.stockId);
  if (ownStock) return { kind: 'stock', id: ownStock.id };

  const crop = editingPlot.crop.trim().toLowerCase();

  const sameFruit = fruits.find((option) => option.type.trim().toLowerCase() === crop);
  if (sameFruit) return { kind: 'fruit', id: sameFruit.id };

  const sameStock = stocks.find((option) => option.type.trim().toLowerCase() === crop);
  return sameStock ? { kind: 'stock', id: sameStock.id } : null;
}
