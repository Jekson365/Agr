import { useEffect, useState } from 'react';

import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { fruitTypeLabel, treeStockLabel } from '@/config/fruit-kinds';
import { todayIsoDate } from '@/config/harvest-analysis';
import { useLanguage } from '@/contexts/language-context';
import { plantOutTreeSeedling } from '@/services/tree-seedling-service';
import type { TreeSeedling } from '@/types/tree-seedling';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  open: boolean;
  seedling: TreeSeedling | null;
  orchards: TreeStock[];
  onClose: () => void;
  onPlanted: (seedling: TreeSeedling) => void;
};

/** The orchards a batch may join: the ones growing the same fruit. A batch of apples raised from
 *  seed is apple trees, so putting it into a pear orchard would misreport what stands there. */
function matchingOrchards(orchards: TreeStock[], type: string): TreeStock[] {
  const wanted = type.trim().toLowerCase();
  return orchards.filter((orchard) => orchard.type.trim().toLowerCase() === wanted);
}

/** Moving a batch outside is its own step because it is the one that changes the orchard: the
 *  count planted is added to that orchard's trees and written into its history. */
export function PlantOutModal({ open, seedling, orchards, onClose, onPlanted }: Props) {
  const { t } = useLanguage();

  const [treeStockId, setTreeStockId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !seedling) return;
    setTreeStockId(matchingOrchards(orchards, seedling.type)[0]?.id ?? null);
    setQuantity(String(seedling.quantity));
    setDate(todayIsoDate());
    setFormError(null);
  }, [open, seedling, orchards]);

  if (!seedling) return null;

  const options = matchingOrchards(orchards, seedling.type);
  const count = Number(quantity);
  const tooMany = count > seedling.quantity;
  const canSubmit = treeStockId != null && count > 0 && !tooMany && !saving;

  async function handleSubmit() {
    if (!canSubmit || treeStockId == null || !seedling) return;
    setSaving(true);
    setFormError(null);
    try {
      const planted = await plantOutTreeSeedling(seedling.id, {
        treeStockId,
        quantity: count,
        date: date || null,
        note: t('nursery.movementNote', { name: seedling.name.trim() || seedling.type }),
      });
      onPlanted(planted);
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('nursery.plantOut')}</h2>
      <p className="limit-hint">{t('nursery.plantOutHint')}</p>
      <p className="limit-hint">{t('nursery.sameKindHint', { kind: fruitTypeLabel(seedling.type, t) })}</p>

      <div className="form-fields">
        <div className="field">
          <label>{t('nursery.orchard')}</label>
          {options.length === 0 ? (
            <p className="limit-hint">{t('nursery.noMatchingOrchard', { kind: fruitTypeLabel(seedling.type, t) })}</p>
          ) : (
            <select value={treeStockId ?? ''} onChange={(e) => setTreeStockId(Number(e.target.value))}>
              {options.map((orchard) => (
                <option key={orchard.id} value={orchard.id}>
                  {treeStockLabel(orchard, t)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('nursery.plantedCount')}</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" inputMode="numeric" />
            <span className="limit-hint">{t('nursery.raisedCount', { count: seedling.quantity })}</span>
          </div>
          <div className="field">
            <label>{t('nursery.plantedOutDate')}</label>
            <DateField value={date} clearable={false} onChange={(v) => setDate(v ?? '')} />
          </div>
        </div>

        {tooMany && <div className="error-banner">{t('nursery.tooMany', { count: seedling.quantity })}</div>}
        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
          {t('nursery.plantOutAction')}
        </button>
      </div>
    </Modal>
  );
}
