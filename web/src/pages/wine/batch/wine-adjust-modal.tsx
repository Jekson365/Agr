import { useEffect, useState } from 'react';

import '@/components/farm/kind-picker.css';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { bottleIconFor } from '@/config/wine-bottles';
import { useLanguage } from '@/contexts/language-context';
import { bottleLotLabel, loadBottleLots, type BottleLot } from '@/pages/wine/wine-bottle-lots';
import { ApiError } from '@/services/api-client';
import { adjustWine } from '@/services/wine-movement-service';

type Props = {
  open: boolean;
  batchId: number;
  onClose: () => void;
  onSaved: () => void;
};

export function WineAdjustModal({ open, batchId, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [liters, setLiters] = useState('');
  const [bottles, setBottles] = useState('');
  const [lots, setLots] = useState<BottleLot[]>([]);
  const [lotId, setLotId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState<string>(todayIsoDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLiters('');
    setBottles('');
    setLotId(null);
    setNote('');
    setDate(todayIsoDate());
    setError(null);
    loadBottleLots(batchId)
      .then(setLots)
      .catch(() => setLots([]));
  }, [open, batchId]);

  const lot = lots.find((row) => row.bottlingId === lotId) ?? lots[0] ?? null;
  const delta = parseFloat(liters) || 0;
  const bottleDelta = lot ? Math.trunc(parseFloat(bottles) || 0) : 0;
  const valid = delta !== 0 || bottleDelta !== 0;

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      await adjustWine({
        wineBatchId: batchId,
        delta,
        bottleDelta,
        wineBottlingId: bottleDelta !== 0 && lot ? lot.bottlingId : null,
        note: note.trim() || null,
        date,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.adjustTooMuch') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('wine.adjust')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('wine.adjustLiters')}</label>
          <input value={liters} inputMode="decimal" placeholder="0" onChange={(e) => setLiters(e.target.value)} />
        </div>
        {lot && (
          <div className="field">
            <label>{t('wine.adjustBottles')}</label>
            <div className="kind-row">
              {lots.map((row) => (
                <button
                  key={row.bottlingId}
                  type="button"
                  className={row.bottlingId === lot.bottlingId ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setLotId(row.bottlingId)}
                >
                  <img src={bottleIconFor(row.size)} className="kind-chip-icon" alt="" />
                  <span>
                    {bottleLotLabel(row, t)} — {row.left} {t('wine.unitBottle')}
                  </span>
                </button>
              ))}
            </div>
            <input value={bottles} inputMode="numeric" placeholder="0" onChange={(e) => setBottles(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label>{t('wine.notes')}</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="field">
          <label>{t('harvest.date')}</label>
          <DateField value={date} clearable={false} onChange={(value) => setDate(value ?? date)} />
        </div>
        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!valid || saving}>
          {t('common.save')}
        </button>
      </div>
    </Modal>
  );
}
