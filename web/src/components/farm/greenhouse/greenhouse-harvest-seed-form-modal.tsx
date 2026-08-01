import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_LABEL_KEY } from '@/config/seed-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createGreenhouseHarvestSeed, updateGreenhouseHarvestSeed } from '@/services/greenhouse-harvest-seed-service';
import { getGreenhouseSeeds } from '@/services/greenhouse-stock-service';
import type { GreenhouseHarvestSeed } from '@/types/greenhouse-harvest-seed';
import type { GreenhouseSeed } from '@/types/greenhouse-stock';

type Props = {
  open: boolean;
  greenhouseHarvestId: number;
  editingSeed: GreenhouseHarvestSeed | null;
  onClose: () => void;
  onSaved: (harvestSeed: GreenhouseHarvestSeed, isNew: boolean) => void;
};

/** Records how much greenhouse seed was sown for a harvest. Saving deducts the amount from that
 * seed. The greenhouse counterpart to HarvestSeedFormModal. */
export function GreenhouseHarvestSeedFormModal({
  open,
  greenhouseHarvestId,
  editingSeed,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [seeds, setSeeds] = useState<GreenhouseSeed[]>([]);
  const [seedsLoading, setSeedsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingSeed != null;

  useEffect(() => {
    if (!open) return;
    setAmountInput(editingSeed ? String(editingSeed.amount) : '');
    setFormError(null);
    loadSeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingSeed]);

  async function loadSeeds() {
    setSeedsLoading(true);
    try {
      // Every greenhouse seed, not just this harvest's greenhouse: the greenhouse a seed is
      // recorded under is where it is kept, and any harvest may sow from it.
      const list = await getGreenhouseSeeds();
      setSeeds(list);
      setSelectedId(editingSeed?.greenhouseSeedId ?? list[0]?.id ?? null);
    } catch {
      setSeeds([]);
      setSelectedId(null);
    } finally {
      setSeedsLoading(false);
    }
  }

  function labelFor(seed: GreenhouseSeed): string {
    return seed.name.trim() || stockTypeLabel(seed.type, t);
  }

  const selected = seeds.find((s) => s.id === selectedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  // Editing gives its previous amount back first, so that much is available on top of the balance.
  const available = selected
    ? selected.amount + (isEditing && editingSeed.greenhouseSeedId === selected.id ? editingSeed.amount : 0)
    : 0;
  const overAvailable = selected != null && amount > available;
  const canSubmit = selected != null && amount > 0 && !overAvailable && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: GreenhouseHarvestSeed = { ...editingSeed, greenhouseSeedId: selectedId, amount };
        await updateGreenhouseHarvestSeed(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createGreenhouseHarvestSeed({ greenhouseHarvestId, greenhouseSeedId: selectedId, amount });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('harvestSeed.edit') : t('harvestSeed.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('seed.title')}</label>
          {seedsLoading ? (
            <span className="limit-hint">…</span>
          ) : seeds.length === 0 ? (
            <p className="limit-hint">{t('harvestSeed.noSeeds')}</p>
          ) : (
            <div className="kind-row">
              {seeds.map((seed) => (
                <button
                  key={seed.id}
                  type="button"
                  className={selectedId === seed.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setSelectedId(seed.id)}
                >
                  <img src={stockKindImage(seed.type)} className="kind-chip-icon" alt="" />
                  <span>{labelFor(seed)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {seeds.length > 0 && (
          <div className="field">
            <label>{t('harvestSeed.amountUsed')}</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder={t('farm.amountPlaceholder')}
              inputMode="decimal"
            />
            {selected && (
              <span className={overAvailable ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
                {t('seed.onHand', { amount: available, unit: t(SEED_UNIT_LABEL_KEY[selected.unit]) })}
              </span>
            )}
          </div>
        )}

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        {seeds.length > 0 && (
          <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
            {isEditing ? t('common.save') : t('common.add')}
          </button>
        )}
      </div>
    </Modal>
  );
}
