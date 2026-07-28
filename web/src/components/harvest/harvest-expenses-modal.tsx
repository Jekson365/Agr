import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import './harvest.css';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { updateHarvest } from '@/services/harvest-service';
import type { Harvest } from '@/types/harvest';

type Props = {
  open: boolean;
  harvest: Harvest;
  onClose: () => void;
  onSaved: (harvest: Harvest) => void;
};

function parseAmount(input: string): number {
  return Math.max(0, parseFloat(input) || 0);
}

export function HarvestExpensesModal({ open, harvest, onClose, onSaved }: Props) {
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
    if (!open) return;
    setRevenueInput(harvest.revenue != null ? String(harvest.revenue) : '');
    setEquipmentInput(harvest.equipmentCost != null ? String(harvest.equipmentCost) : '');
    setWorkersInput(harvest.workersCost != null ? String(harvest.workersCost) : '');
    setFuelInput(harvest.fuelCost != null ? String(harvest.fuelCost) : '');
    setOtherInput(harvest.otherCost != null ? String(harvest.otherCost) : '');
    setFormError(null);
  }, [open, harvest]);

  const revenue = parseAmount(revenueInput);
  const total = parseAmount(equipmentInput) + parseAmount(workersInput) + parseAmount(fuelInput) + parseAmount(otherInput);
  const net = revenue - total;

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);
    try {
      const updated: Harvest = {
        ...harvest,
        revenue: revenueInput.trim() ? parseAmount(revenueInput) : null,
        equipmentCost: equipmentInput.trim() ? parseAmount(equipmentInput) : null,
        workersCost: workersInput.trim() ? parseAmount(workersInput) : null,
        fuelCost: fuelInput.trim() ? parseAmount(fuelInput) : null,
        otherCost: otherInput.trim() ? parseAmount(otherInput) : null,
      };
      await updateHarvest(updated.id, updated);
      onSaved(updated);
      onClose();
    } catch {
      setFormError(t('harvest.expensesSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('harvest.expensesTitle')}</h2>

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
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
