import { useEffect, useState } from 'react';

import grapeIcon from '@/assets/goods/grape.png';
import '@/components/farm/kind-picker.css';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import type { GrapeOption } from '@/pages/wine/wine-grape-options';
import { ApiError } from '@/services/api-client';
import { createWineGrape } from '@/services/wine-grape-service';
import type { WineBatchGrape } from '@/types/wine';

type Props = {
  open: boolean;
  batchId: number;
  used: WineBatchGrape[];
  options: GrapeOption[];
  onClose: () => void;
  onSaved: () => void;
};

export function WineGrapeFormModal({ open, batchId, used, options, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const taken = new Set(used.map((row) => row.treeProductId));
  const choices = options.filter(
    (option) => !taken.has(option.treeProductId) && !option.isDeleted && option.available > 0
  );

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setAmountInput('');
    setError(null);
  }, [open]);

  const selected = choices.find((option) => option.treeProductId === selectedId) ?? choices[0] ?? null;
  const available = selected?.available ?? 0;
  const amount = parseFloat(amountInput) || 0;
  const over = amount > available;
  const valid = selected != null && amount > 0 && !over;

  async function handleSubmit() {
    if (!valid || !selected || saving) return;
    setSaving(true);
    setError(null);
    try {
      await createWineGrape({ wineBatchId: batchId, treeProductId: selected.treeProductId, amount });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.grapesOver') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('wine.grapesAdd')}</h2>
      <div className="form-fields">
        <div className="field">
          <label>{t('wine.grapesTitle')}</label>
          {choices.length === 0 ? (
            <p className="limit-hint">{t('wine.grapesNone')}</p>
          ) : (
            <div className="kind-row">
              {choices.map((option) => (
                <button
                  key={option.treeProductId}
                  type="button"
                  className={selected?.treeProductId === option.treeProductId ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(option.treeProductId)}
                >
                  <img src={grapeIcon} className="kind-chip-icon" alt="" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {selected && (
          <div className="field">
            <label>{t('farm.amount')}</label>
            <input value={amountInput} inputMode="decimal" placeholder="0" onChange={(e) => setAmountInput(e.target.value)} />
            <span className={over ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
              {t('wine.grapesAvailable', { amount: available })}
            </span>
          </div>
        )}

        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {choices.length > 0 && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!valid || saving}>
            {t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
