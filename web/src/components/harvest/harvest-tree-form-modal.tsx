import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createHarvestTree, updateHarvestTree } from '@/services/harvest-tree-service';
import type { HarvestKind } from '@/types/harvest';
import type { HarvestTree } from '@/types/harvest-tree';
import { loadPickOptions, pickKeyPrefix, pickTarget, pickTargetId, type PickOption } from './harvest-pick-options';
import './harvest.css';

type Props = {
  open: boolean;
  kind: HarvestKind;
  harvestId: number;
  editingTree: HarvestTree | null;
  existingTrees: HarvestTree[];
  canRecordHarvested: boolean;
  onClose: () => void;
  onSaved: (harvestTree: HarvestTree, isNew: boolean) => void;
};

export function HarvestTreeFormModal({
  open,
  kind,
  harvestId,
  editingTree,
  existingTrees,
  canRecordHarvested,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();
  const prefix = pickKeyPrefix(kind);

  const [options, setOptions] = useState<PickOption[]>([]);
  const [hadAny, setHadAny] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [harvestedInput, setHarvestedInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingTree != null;
  const editingTargetId = editingTree ? pickTargetId(kind, editingTree) : null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingTree ? String(editingTree.amount) : '');
    setHarvestedInput(editingTree ? String(editingTree.harvestedAmount) : '');
    setFormError(null);
    loadOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingTree]);

  async function loadOptions() {
    setLoading(true);
    try {
      const list = await loadPickOptions(kind, t);
      setHadAny(list.some((option) => !option.isDeleted));
      const picked = new Set(
        existingTrees.filter((tree) => tree.id !== editingTree?.id).map((tree) => pickTargetId(kind, tree))
      );
      const free = list.filter(
        (option) => !picked.has(option.id) && (!option.isDeleted || option.id === editingTargetId)
      );
      setOptions(free);
      setSelectedId(editingTargetId ?? free[0]?.id ?? null);
    } catch {
      setOptions([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }

  const selected = options.find((option) => option.id === selectedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  const harvestedAmount = canRecordHarvested
    ? Math.max(0, parseFloat(harvestedInput) || 0)
    : editingTree?.harvestedAmount ?? 0;
  const overAvailable = selected != null && amount > selected.amount;
  const canSubmit = selected != null && amount > 0 && !overAvailable && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = pickTarget(kind, selectedId);
      if (isEditing) {
        const updated: HarvestTree = { ...editingTree, ...target, amount, harvestedAmount };
        await updateHarvestTree(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestTree({ harvestId, ...target, amount, harvestedAmount });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t(editingTree ? `${prefix}.alreadyPicked` : `${prefix}.onlyOne`)
          : t('farm.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t(`${prefix}.edit`) : t(`${prefix}.add`)}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t(kind === 'Wine' ? 'wine.stockTitle' : 'farm.fruits')}</label>
          {loading ? (
            <span className="limit-hint">…</span>
          ) : options.length === 0 ? (
            <p className="limit-hint">{t(hadAny ? `${prefix}.allPicked` : `${prefix}.noTrees`)}</p>
          ) : (
            <div className="kind-row">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={selectedId === option.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(option.id)}
                >
                  <img src={option.icon} className="kind-chip-icon" alt="" />
                  <span>{option.label}</span>
                  {option.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {options.length > 0 && (
          <div className="field">
            <label>{t(`${prefix}.amountPicked`)}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && (
              <span className={overAvailable ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {t(`${prefix}.available`, { amount: selected.amount, unit: selected.unitLabel })}
              </span>
            )}
          </div>
        )}

        {options.length > 0 && (
          <div className="field">
            <label>{t(`${prefix}.amountHarvested`)}</label>
            {canRecordHarvested ? (
              <span className="harvest-tree-weight">
                <input
                  value={harvestedInput}
                  onChange={(e) => setHarvestedInput(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
                <span className="harvest-tree-unit">{selected?.harvestedUnitLabel ?? t('farm.unitKg')}</span>
              </span>
            ) : (
              <p className="limit-hint">{t(`${prefix}.harvestedLater`)}</p>
            )}
          </div>
        )}

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {options.length > 0 && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? t('common.save') : t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
