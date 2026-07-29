import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { Modal } from '@/components/ui/modal';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLivestockKind, deleteLivestockKind, getLivestockKinds } from '@/services/livestock-kind-service';
import { createLivestock, updateLivestock } from '@/services/livestock-service';
import type { Farm } from '@/types/farm';
import type { AnimalType, Livestock } from '@/types/livestock';
import type { LivestockKind } from '@/types/livestock-kind';

type Props = {
  open: boolean;
  editingItem: Livestock | null;
  farms: Farm[];
  /** The groups that already exist, so a duplicate name is caught before saving. */
  existingItems: Livestock[];
  onClose: () => void;
  onSaved: (item: Livestock, isNew: boolean) => void;
  /** Called instead of showing an inline error when the plan cap is what refused the write. */
  onLimitReached?: (message: string) => void;
};

export function LivestockFormModal({
  open,
  editingItem,
  farms,
  existingItems,
  onClose,
  onSaved,
  onLimitReached,
}: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<LivestockKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [kindError, setKindError] = useState<string | null>(null);
  const [confirmDeleteKind, setConfirmDeleteKind] = useState<{ id: number; label: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [livestockType, setLivestockType] = useState<AnimalType>('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;
  const farmId = editingItem?.farmId ?? farms[0]?.id ?? null;
  const noFarmAvailable = farmId == null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setKindError(null);
    setNameInput(editingItem?.name ?? '');
    setCountInput(editingItem ? String(editingItem.count) : '');
    setLivestockType(editingItem?.type ?? '');
    loadKinds(editingItem?.type ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getLivestockKinds();
      setKinds(list);
      if (!preset) {
        setLivestockType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    setKindError(null);

    // A name is a duplicate if it matches an existing kind's raw name OR its localized label —
    // built-in kinds are stored under English keys ("Cow") but displayed translated ("ძროხა"),
    // and either spelling would show up as a second identical entry in the picker.
    const candidate = name.trim().toLowerCase();
    const isDuplicate = kinds.some((k) => {
      const label = livestockTypeLabel(k.name, t);
      return k.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setKindError(t('farm.typeDuplicate'));
      return null;
    }

    try {
      const created = await createLivestockKind({ name });
      setKinds((prev) => (prev.some((k) => k.id === created.id) ? prev : [...prev, created]));
      return { value: created.name, label: livestockTypeLabel(created.name, t), icon: livestockImage(created.name) };
    } catch (err) {
      // The server rejects names that already exist (e.g. added from another session).
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeDuplicate') : t('farm.typeSaveError'));
      return null;
    }
  }

  async function confirmDeleteKindNow() {
    if (!confirmDeleteKind) return;
    const { id } = confirmDeleteKind;

    setKindError(null);
    try {
      await deleteLivestockKind(id);
      const deleted = kinds.find((k) => k.id === id);
      const next = kinds.filter((k) => k.id !== id);
      setKinds(next);
      // Don't leave the form pointing at a kind that no longer exists.
      if (deleted && deleted.name === livestockType) {
        setLivestockType(next[0]?.name ?? '');
      }
    } catch (err) {
      // The server refuses to delete a kind that existing livestock groups still reference.
      setKindError(err instanceof ApiError && err.status === 409 ? t('farm.typeInUse') : t('farm.typeDeleteError'));
    } finally {
      setConfirmDeleteKind(null);
    }
  }

  async function handleSubmit() {
    const trimmedName = nameInput.trim();
    if (!trimmedName || farmId == null || !livestockType) return;

    // Groups are identified by name across the app (production, balances, reports), so two
    // groups sharing one would be indistinguishable. The server enforces this too.
    const nameTaken = existingItems.some(
      (item) => item.id !== editingItem?.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameTaken) {
      setFormError(t('farm.nameDuplicate'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const count = Math.max(0, parseInt(countInput, 10) || 0);
      if (isEditing) {
        const updated: Livestock = { id: editingItem!.id, type: livestockType, count, name: trimmedName, farmId };
        await updateLivestock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestock({ type: livestockType, count, name: trimmedName, farmId });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      // The server rejects a name another group already uses (e.g. added from another session).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('farm.nameDuplicate'));
      } else {
        setFormError(err instanceof Error ? err.message : t('farm.saveError'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{isEditing ? t('farm.editLivestock') : t('farm.addLivestock')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('farm.namePlaceholderLivestock')} />
        </div>

        <div className="field">
          <label>{t('farm.type')}</label>
          <KindPicker
            options={kinds.map((k) => ({
              value: k.name,
              label: livestockTypeLabel(k.name, t),
              icon: livestockImage(k.name),
            }))}
            selected={livestockType}
            onSelect={setLivestockType}
            onAddNew={handleAddKind}
            addPlaceholder={t('farm.newLivestockTypePlaceholder')}
            loading={kindsLoading}
            onRemove={(value) => {
              const kind = kinds.find((k) => k.name === value);
              if (kind) setConfirmDeleteKind({ id: kind.id, label: livestockTypeLabel(kind.name, t) });
            }}
            removeLabel={t('common.delete')}
          />
          {kindError && <div className="error-banner">{kindError}</div>}
        </div>

        <div className="field">
          <label>{t('farm.count')}</label>
          <input
            type="number"
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            placeholder={t('farm.countPlaceholder')}
          />
        </div>

        {noFarmAvailable && <p className="limit-hint">{t('farm.noFarmland')}</p>}

        {formError && <div className="error-banner">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={saving || noFarmAvailable || !livestockType}>
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>

      <ConfirmDeleteModal
        open={!!confirmDeleteKind}
        name={confirmDeleteKind?.label ?? ''}
        onCancel={() => setConfirmDeleteKind(null)}
        onConfirm={confirmDeleteKindNow}
      />
    </Modal>
  );
}
