import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { todayIsoDate } from '@/components/ui/date-utils';
import {
  TREE_PLANTING_REASONS,
  TREE_REASON_OTHER,
  TREE_REMOVAL_REASONS,
  treeMovementReasonLabel,
} from '@/config/tree-planting';
import { useLanguage } from '@/contexts/language-context';
import { adjustBalance } from '@/services/balance-adjustment-service';

type Props = {
  open: boolean;
  treeStockId: number;
  direction: 'plant' | 'remove';
  available: number;
  unitLabel: string;
  onClose: () => void;
  onSaved: () => void;
};

export function TreePlantingModal({
  open,
  treeStockId,
  direction,
  available,
  unitLabel,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [countInput, setCountInput] = useState('');
  const [date, setDate] = useState<string | null>(todayIsoDate());
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planting = direction === 'plant';
  const reasons = planting ? TREE_PLANTING_REASONS : TREE_REMOVAL_REASONS;

  useEffect(() => {
    if (!open) return;
    setCountInput('');
    setDate(todayIsoDate());
    setReason(planting ? TREE_PLANTING_REASONS[0] : TREE_REMOVAL_REASONS[0]);
    setCustomReason('');
    setError(null);
  }, [open, planting]);

  const count = parseFloat(countInput) || 0;
  const custom = reason === TREE_REASON_OTHER;
  const customText = customReason.trim();
  const overAvailable = !planting && count > available;
  const canSave = count > 0 && !overAvailable && (!custom || customText.length > 0) && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await adjustBalance(
        { kind: 'treeStock', treeStockId },
        { delta: planting ? count : -count, note: custom ? customText : reason, date }
      );
      onSaved();
      onClose();
    } catch {
      setError(t('balance.adjustError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t(planting ? 'treeStockHistory.plant' : 'treeStockHistory.remove')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('balance.adjustQuantity')}</label>
          <input
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
            inputMode="decimal"
          />
          <span className={overAvailable ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
            {t('balance.adjustAvailable', { amount: available, unit: unitLabel })}
          </span>
        </div>

        <div className="field">
          <label>{t('balance.adjustDate')}</label>
          <DateField value={date} onChange={setDate} />
        </div>

        <div className="field">
          <label>{t('treeStockHistory.reason')}</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((option) => (
              <option key={option} value={option}>
                {treeMovementReasonLabel(option, t)}
              </option>
            ))}
          </select>
        </div>

        {custom && (
          <div className="field">
            <label>{t('treeStockHistory.reasonCustom')}</label>
            <input
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t('treeStockHistory.reasonCustomPlaceholder')}
            />
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSave} disabled={!canSave}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
