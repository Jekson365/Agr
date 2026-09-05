import { useEffect, useState } from 'react';

import './harvest.css';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { updateHarvest } from '@/services/harvest-service';
import type { Harvest } from '@/types/harvest';

type Props = {
  harvest: Harvest;
  onSaved: (harvest: Harvest) => void;
  onCancel?: () => void;
};

function parseAmount(input: string): number {
  return Math.max(0, parseFloat(input) || 0);
}

function toInput(value: number | null): string {
  return value != null ? String(value) : '';
}

export function HarvestMoneyForm({ harvest, onSaved, onCancel }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [revenueInput, setRevenueInput] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');
  const [workersInput, setWorkersInput] = useState('');
  const [fuelInput, setFuelInput] = useState('');
  const [otherInput, setOtherInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setRevenueInput(toInput(harvest.revenue));
    setEquipmentInput(toInput(harvest.equipmentCost));
    setWorkersInput(toInput(harvest.workersCost));
    setFuelInput(toInput(harvest.fuelCost));
    setOtherInput(toInput(harvest.otherCost));
    setFormError(null);
  }, [harvest]);

  const revenue = parseAmount(revenueInput);
  const total = parseAmount(equipmentInput) + parseAmount(workersInput) + parseAmount(fuelInput) + parseAmount(otherInput);
  const net = revenue - total;

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);
    try {
      const updated: Harvest = {
        ...harvest,
        revenue: revenueInput.trim() ? revenue : null,
        equipmentCost: equipmentInput.trim() ? parseAmount(equipmentInput) : null,
        workersCost: workersInput.trim() ? parseAmount(workersInput) : null,
        fuelCost: fuelInput.trim() ? parseAmount(fuelInput) : null,
        otherCost: otherInput.trim() ? parseAmount(otherInput) : null,
      };
      await updateHarvest(updated.id, updated);
      onSaved(updated);
      onCancel?.();
    } catch {
      setFormError(t('harvest.expensesSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="form-fields">
        <div className="field-row">
          <div className="field">
            <label>{t('harvest.revenueLabel')}</label>
            <input value={revenueInput} onChange={(e) => setRevenueInput(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('harvest.expenseEquipment')}</label>
            <input value={equipmentInput} onChange={(e) => setEquipmentInput(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
          <div className="field">
            <label>{t('harvest.expenseWorkers')}</label>
            <input value={workersInput} onChange={(e) => setWorkersInput(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('harvest.expenseFuel')}</label>
            <input value={fuelInput} onChange={(e) => setFuelInput(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
          <div className="field">
            <label>{t('harvest.expenseOther')}</label>
            <input value={otherInput} onChange={(e) => setOtherInput(e.target.value)} placeholder="0" inputMode="decimal" />
          </div>
        </div>

        <div className="expenses-total-row">
          <span className="expenses-total-label">{t('harvest.expensesTotal')}</span>
          <span className="expenses-total-value">{formatPrice(total)}</span>
        </div>

        <div className="expenses-net-row">
          <span className="expenses-total-label">{t('harvest.netTotal')}</span>
          <span className={net < 0 ? 'expenses-net-value negative' : 'expenses-net-value'}>{formatPrice(net)}</span>
        </div>

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
        )}
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
          {t('common.save')}
        </button>
      </div>
    </>
  );
}
