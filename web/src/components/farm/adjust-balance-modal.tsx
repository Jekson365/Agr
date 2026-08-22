import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { adjustBalance } from '@/services/balance-adjustment-service';
import type { BalanceAdjustOption } from '@/types/balance-adjustment';

type Props = {
  open: boolean;
  options: BalanceAdjustOption[];
  onClose: () => void;
  onSaved: () => void;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function AdjustBalanceModal({ open, options, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [selectedKey, setSelectedKey] = useState('');
  const [direction, setDirection] = useState<'add' | 'remove'>('add');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState<string | null>(todayIsoDate());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedKey(options[0]?.key ?? '');
    setDirection('add');
    setAmountInput('');
    setDate(todayIsoDate());
    setNote('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = options.find((option) => option.key === selectedKey) ?? null;
  const amount = parseFloat(amountInput) || 0;
  const overBalance = selected != null && direction === 'remove' && amount > selected.balance;
  const canSave = selected != null && amount > 0 && !overBalance && !saving;

  async function handleSave() {
    if (!selected || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      await adjustBalance(selected.target, {
        delta: direction === 'add' ? amount : -amount,
        note: note.trim() || null,
        date,
      });
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
      <h2 className="form-title">{t('balance.adjustTitle')}</h2>

      {options.length === 0 ? (
        <p className="modal-body-text">{t('balance.adjustNoOptions')}</p>
      ) : (
        <div className="form-fields">
          <div className="field">
            <label>{t('balance.adjustProduct')}</label>
            {options.length === 1 ? (
              <span className="limit-hint field-fixed-value">{options[0].title}</span>
            ) : (
              <select value={selectedKey} onChange={(e) => setSelectedKey(e.target.value)}>
                {options.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.title} — {round2(option.balance)} {option.unitLabel}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="field">
            <label>{t('balance.adjustDirection')}</label>
            <div className="kind-row balance-adjust-row">
              <button
                type="button"
                className={direction === 'add' ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setDirection('add')}
              >
                <span>{t('balance.adjustAdd')}</span>
              </button>
              <button
                type="button"
                className={direction === 'remove' ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setDirection('remove')}
              >
                <span>{t('balance.adjustRemove')}</span>
              </button>
            </div>
          </div>

          <div className="field">
            <label>{t('balance.adjustQuantity')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && (
              <span className={overBalance ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {t('balance.adjustAvailable', { amount: round2(selected.balance), unit: selected.unitLabel })}
              </span>
            )}
          </div>

          <div className="field">
            <label>{t('balance.adjustDate')}</label>
            <DateField value={date} onChange={setDate} clearable={false} />
          </div>

          <div className="field">
            <label>{t('balance.adjustNote')}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('balance.adjustNotePlaceholder')}
            />
          </div>
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

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
