import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_OPTIONS } from '@/config/seed-kinds';
import { stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { updateGreenhouseSeed } from '@/services/greenhouse-stock-service';
import type { GreenhouseSeed } from '@/types/greenhouse-stock';
import type { SeedUnit } from '@/types/seed';

type Props = {
  open: boolean;
  editingSeed: GreenhouseSeed | null;
  onClose: () => void;
  onSaved: (seed: GreenhouseSeed) => void;
};

/**
 * Adjusts how much seed a greenhouse holds. The crop and the greenhouse are fixed — a seed row is
 * created with its stock, so changing what it is would break that pairing; only the quantity moves.
 */
export function GreenhouseSeedFormModal({ open, editingSeed, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<SeedUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !editingSeed) return;
    setAmountInput(String(editingSeed.amount));
    setUnit(editingSeed.unit);
    setFormError(null);
  }, [open, editingSeed]);

  async function handleSubmit() {
    if (!editingSeed || saving) return;

    setSaving(true);
    setFormError(null);
    try {
      const updated: GreenhouseSeed = {
        ...editingSeed,
        amount: Math.max(0, parseFloat(amountInput) || 0),
        unit,
      };
      await updateGreenhouseSeed(updated.id, updated);
      onSaved(updated);
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('seed.edit')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('seed.crop')}</label>
          <div className="seed-crop-readout">
            <span>{editingSeed ? editingSeed.name.trim() || stockTypeLabel(editingSeed.type, t) : ''}</span>
          </div>
        </div>

        <div className="field">
          <label>{t('seed.amountLabel')}</label>
          <input
            type="number"
            step="0.01"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          <div className="kind-row">
            {SEED_UNIT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={unit === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setUnit(opt.value as SeedUnit)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
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
