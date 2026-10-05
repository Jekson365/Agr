import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { round2 } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createWineBottling, updateWineBottling } from '@/services/wine-bottling-service';
import type { WineBottling } from '@/types/wine';

type Props = {
  open: boolean;
  batchId: number;
  litersInCellar: number;
  editing: WineBottling | null;
  onClose: () => void;
  onSaved: () => void;
};

export function WineBottlingFormModal({ open, batchId, litersInCellar, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [date, setDate] = useState(todayIsoDate());
  const [size, setSize] = useState('0.75');
  const [count, setCount] = useState('');
  const [lot, setLot] = useState('');
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(editing?.date ?? todayIsoDate());
    setSize(String(editing?.bottleSize ?? 0.75));
    setCount(editing ? String(editing.count) : '');
    setLot(editing?.lot ?? '');
    setCost(editing?.cost != null ? String(editing.cost) : '');
    setError(null);
  }, [open, editing]);

  const bottleSize = parseFloat(size) || 0;
  const bottleCount = Math.trunc(parseFloat(count) || 0);
  const needed = round2(bottleSize * bottleCount);
  const available = round2(litersInCellar + (editing ? editing.bottleSize * editing.count : 0));
  const over = needed > available;
  const costValue = cost.trim() === '' ? null : parseFloat(cost);
  const valid = bottleSize > 0 && bottleCount > 0 && !over && (costValue == null || costValue >= 0);

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const record = { wineBatchId: batchId, date, bottleSize, count: bottleCount, lot: lot.trim() || null, cost: costValue };
    try {
      if (editing) {
        await updateWineBottling({ ...record, id: editing.id });
      } else {
        await createWineBottling(record);
      }
      onSaved();
      onClose();
    } catch (err) {
      const conflict = err instanceof ApiError && err.status === 409;
      setError(conflict ? t(editing ? 'wine.bottlingSold' : 'wine.bottlingTooMuch') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{editing ? t('wine.bottlingEdit') : t('wine.bottlingAdd')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(value) => setDate(value ?? date)} />
        </div>
        <div className="field">
          <label>{t('wine.bottleSize')}</label>
          <input value={size} inputMode="decimal" placeholder="0" onChange={(e) => setSize(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('wine.bottleCount')}</label>
            <input value={count} inputMode="numeric" placeholder="0" onChange={(e) => setCount(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('wine.lot')}</label>
            <input value={lot} onChange={(e) => setLot(e.target.value)} />
          </div>
        </div>
        <span className={over ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
          {t('wine.bottlingNeeds', { liters: needed, available })}
        </span>
        <div className="field">
          <label>{t('wine.cost')}</label>
          <input value={cost} inputMode="decimal" placeholder="0" onChange={(e) => setCost(e.target.value)} />
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!valid || saving}>
          {editing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
