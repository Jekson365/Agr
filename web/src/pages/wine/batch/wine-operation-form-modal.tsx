import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { round2, WINE_OPERATION_KINDS, WINE_OPERATION_LABEL_KEY } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createWineOperation, updateWineOperation } from '@/services/wine-operation-service';
import type { WineOperation, WineOperationKind } from '@/types/wine';

type Props = {
  open: boolean;
  batchId: number;
  litersInCellar: number;
  editing: WineOperation | null;
  onClose: () => void;
  onSaved: () => void;
};

const optional = (text: string) => (text.trim() === '' ? null : parseFloat(text.replace(',', '.')));

export function WineOperationFormModal({ open, batchId, litersInCellar, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [date, setDate] = useState(todayIsoDate());
  const [kind, setKind] = useState<WineOperationKind>('PunchDown');
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [lost, setLost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(editing?.date ?? todayIsoDate());
    setKind(editing?.kind ?? 'PunchDown');
    setNote(editing?.note ?? '');
    setCost(editing?.cost != null ? String(editing.cost) : '');
    setLost(editing?.litersLost != null ? String(editing.litersLost) : '');
    setError(null);
  }, [open, editing]);

  const costValue = optional(cost);
  const lostValue = optional(lost);
  const available = round2(litersInCellar + (editing?.litersLost ?? 0));
  const lostOver = lostValue != null && lostValue > available;
  const valid =
    (costValue == null || (Number.isFinite(costValue) && costValue >= 0)) &&
    (lostValue == null || (Number.isFinite(lostValue) && lostValue >= 0)) &&
    !lostOver;

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const record = { wineBatchId: batchId, date, kind, note: note.trim() || null, cost: costValue, litersLost: lostValue };
    try {
      if (editing) {
        await updateWineOperation({ ...record, id: editing.id });
      } else {
        await createWineOperation(record);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.lostTooMuch') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{editing ? t('wine.workEdit') : t('wine.workAdd')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(value) => setDate(value ?? date)} />
        </div>
        <div className="field">
          <label>{t('wine.workKind')}</label>
          <div className="kind-row">
            {WINE_OPERATION_KINDS.map((option) => (
              <button
                key={option}
                type="button"
                className={kind === option ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setKind(option)}
              >
                <span>{t(WINE_OPERATION_LABEL_KEY[option])}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>{t('wine.notes')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>{t('wine.cost')}</label>
            <input value={cost} inputMode="decimal" placeholder="0" onChange={(e) => setCost(e.target.value)} />
          </div>
          <div className="field">
            <label>{t('wine.litersLost')}</label>
            <input value={lost} inputMode="decimal" placeholder="0" onChange={(e) => setLost(e.target.value)} />
          </div>
        </div>
        <span className={lostOver ? 'limit-hint listing-quantity-over' : 'limit-hint'}>{t('wine.litersLostHint')}</span>
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
