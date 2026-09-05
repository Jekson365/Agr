import { useEffect, useState } from 'react';

import { KindDropdown } from '@/components/farm/kind-dropdown';
import { DateField } from '@/components/ui/date-field';
import { Modal } from '@/components/ui/modal';
import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { todayIsoDate } from '@/config/harvest-analysis';
import { useLanguage } from '@/contexts/language-context';
import { getFruitKinds } from '@/services/fruit-kind-service';
import { createTreeSeedling, updateTreeSeedling } from '@/services/tree-seedling-service';
import type { FruitKind } from '@/types/fruit-kind';
import type { TreeSeedling } from '@/types/tree-seedling';

type Props = {
  open: boolean;
  editing: TreeSeedling | null;
  onClose: () => void;
  onSaved: (seedling: TreeSeedling, isNew: boolean) => void;
};

export function NurseryFormModal({ open, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<FruitKind[]>([]);
  const [type, setType] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [sownDate, setSownDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType(editing?.type ?? '');
    setName(editing?.name ?? '');
    setQuantity(editing != null ? String(editing.quantity) : '');
    setSownDate(editing?.sownDate ?? todayIsoDate());
    setLocation(editing?.location ?? '');
    setNotes(editing?.notes ?? '');
    setFormError(null);
    getFruitKinds()
      .then(setKinds)
      .catch(() => setKinds([]));
  }, [open, editing]);

  const count = Number(quantity);
  const canSubmit = !!type && count > 0 && !!sownDate && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        type,
        name: name.trim(),
        quantity: count,
        stage: editing?.stage ?? ('Sown' as const),
        sownDate,
        sproutedDate: editing?.sproutedDate ?? null,
        hardeningDate: editing?.hardeningDate ?? null,
        readyDate: editing?.readyDate ?? null,
        plantedOutDate: editing?.plantedOutDate ?? null,
        location: location.trim(),
        notes: notes.trim() || null,
        treeStockId: editing?.treeStockId ?? null,
        plantedOutQuantity: editing?.plantedOutQuantity ?? 0,
      };

      if (editing) {
        const updated = { ...payload, id: editing.id };
        await updateTreeSeedling(editing.id, updated);
        onSaved(updated, false);
      } else {
        onSaved(await createTreeSeedling(payload), true);
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
      <h2 className="form-title">{editing ? t('nursery.edit') : t('nursery.add')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('nursery.kind')}</label>
          <KindDropdown
            options={kinds.map((kind) => ({
              value: kind.name,
              label: fruitTypeLabel(kind.name, t),
              icon: fruitKindImage(kind.name),
            }))}
            selected={type}
            onSelect={setType}
            size="large"
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label>{t('nursery.label')}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('nursery.labelPlaceholder')} />
          </div>
          <div className="field">
            <label>{t('nursery.quantity')}</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0" inputMode="numeric" />
          </div>
        </div>

        <div className="field">
          <label>{t('nursery.sownDate')}</label>
          <DateField value={sownDate} clearable={false} onChange={(v) => setSownDate(v ?? '')} />
        </div>

        <div className="field">
          <label>{t('nursery.location')}</label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('nursery.locationPlaceholder')} />
        </div>

        <div className="field">
          <label>{t('nursery.notes')}</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
          {editing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
