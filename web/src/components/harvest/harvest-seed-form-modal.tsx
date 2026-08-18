import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestSeed, updateHarvestSeed } from '@/services/harvest-seed-service';
import { getSeeds } from '@/services/seed-service';
import type { HarvestSeed } from '@/types/harvest-seed';
import type { Seed } from '@/types/seed';

type Props = {
  open: boolean;
  harvestId: number;
  editingSeed: HarvestSeed | null;
  onClose: () => void;
  onSaved: (harvestSeed: HarvestSeed, isNew: boolean) => void;
};

/** Records how much seed was sown for a harvest. Saving deducts the amount from that seed. */
export function HarvestSeedFormModal({ open, harvestId, editingSeed, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [seeds, setSeeds] = useState<Seed[]>([]);
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
      // Removed seed comes back too, but only stays on the list for the row already recorded
      // against it: without it that row's seed resolves to nothing, which leaves the form with
      // no selection and its save button permanently disabled. Sowing more of it is over.
      const list = await getSeeds(true);
      const editingSeedId = editingSeed?.seedId ?? null;
      const allowed = list.filter((s) => !s.isDeleted || s.id === editingSeedId);
      setSeeds(allowed);
      setSelectedId(editingSeedId ?? allowed[0]?.id ?? null);
    } catch {
      setSeeds([]);
      setSelectedId(null);
    } finally {
      setSeedsLoading(false);
    }
  }

  function labelFor(seed: Seed): string {
    return seedTitle(seed, t);
  }

  const selected = seeds.find((s) => s.id === selectedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  // Editing gives its previous amount back first, so that much is available on top of the balance.
  const available = selected ? selected.amount + (isEditing && editingSeed.seedId === selected.id ? editingSeed.amount : 0) : 0;
  const overAvailable = selected != null && amount > available;
  const canSubmit = selected != null && amount > 0 && !overAvailable && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (isEditing) {
        const updated: HarvestSeed = { ...editingSeed, seedId: selectedId, amount };
        await updateHarvestSeed(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestSeed({ harvestId, seedId: selectedId, amount });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
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
                  {/* Only the row already recorded against it keeps a removed seed on this list —
                      say so, or it reads as an ordinary choice. */}
                  {seed.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
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
