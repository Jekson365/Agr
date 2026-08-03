import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { Modal } from '@/components/ui/modal';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { PRODUCTION_TYPE_LABEL_KEY } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLivestockKind, deleteLivestockKind, getLivestockKinds } from '@/services/livestock-kind-service';
import { createLivestock, getLivestockItem, updateLivestock } from '@/services/livestock-service';
import { createProductionType, deleteProductionType, getProductionTypes } from '@/services/production-type-service';
import type { Farm } from '@/types/farm';
import type { AnimalType, Livestock } from '@/types/livestock';
import type { LivestockKind } from '@/types/livestock-kind';
import type { ProductionType } from '@/types/production-type';

type Props = {
  open: boolean;
  editingItem: Livestock | null;
  farms: Farm[];
  existingItems: Livestock[];
  onClose: () => void;
  onSaved: (item: Livestock, isNew: boolean) => void;
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
  const [confirmDeleteProduces, setConfirmDeleteProduces] = useState<{ id: number; label: string } | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [livestockType, setLivestockType] = useState<AnimalType>('');
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [productionTypesLoading, setProductionTypesLoading] = useState(true);
  const [productionTypeId, setProductionTypeId] = useState<number | null>(null);
  /**
   * What the group produces is chosen once. The records it has collected are counted under it, so
   * a group that already carries one shows it back rather than offering to move its history to
   * another output — a group that has yet to declare one still chooses here.
   */
  const [producesLocked, setProducesLocked] = useState(false);
  const [productionTypeError, setProductionTypeError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;
  const farmId = editingItem?.farmId ?? farms[0]?.id ?? null;
  const noFarmAvailable = farmId == null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setKindError(null);
    setProductionTypeError(null);
    setNameInput(editingItem?.name ?? '');
    setCountInput(editingItem ? String(editingItem.count) : '');
    setLivestockType(editingItem?.type ?? '');
    setProductionTypeId(editingItem?.productionTypeId ?? null);
    setProducesLocked(editingItem?.productionTypeId != null);
    loadKinds(editingItem?.type ?? null);
    loadProductionTypes(editingItem?.productionTypeId ?? null);
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

  async function loadProductionTypes(preset: number | null) {
    setProductionTypesLoading(true);
    try {
      const list = await getProductionTypes();
      setProductionTypes(list);
      // A group has to say what it produces, so default to the first output on offer.
      setProductionTypeId(preset ?? list[0]?.id ?? null);
    } catch {
      setProductionTypes([]);
      setProductionTypeId(preset);
    } finally {
      setProductionTypesLoading(false);
    }
  }

  /** A new output, added from here — this is where a group's produce is chosen, so it is also
   *  where one the catalog is missing gets added. */
  async function handleAddProductionType(name: string): Promise<KindOption | null> {
    setProductionTypeError(null);

    // Built-in types are stored under an English key ("Milk") and shown translated, so either
    // spelling of an existing one would come back as a second identical entry in the picker.
    const candidate = name.trim().toLowerCase();
    const isDuplicate = productionTypes.some((productionType) => {
      const label = productionTypeLabel(productionType);
      return productionType.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setProductionTypeError(t('production.typeDuplicate'));
      return null;
    }

    try {
      const created = await createProductionType(name);
      setProductionTypes((prev) => (prev.some((pt) => pt.id === created.id) ? prev : [...prev, created]));
      return { value: String(created.id), label: productionTypeLabel(created) };
    } catch (err) {
      // The server rejects names that already exist (e.g. added from another session).
      setProductionTypeError(
        err instanceof ApiError && err.status === 409 ? t('production.typeDuplicate') : t('production.typeSaveError')
      );
      return null;
    }
  }

  /** Removing an output from the catalog. The server refuses while records — or a group declaring
   *  it — still reference it, so only one nothing points at actually goes. */
  async function confirmDeleteProducesNow() {
    if (!confirmDeleteProduces) return;
    const { id } = confirmDeleteProduces;

    setProductionTypeError(null);
    try {
      await deleteProductionType(id);
      const next = productionTypes.filter((productionType) => productionType.id !== id);
      setProductionTypes(next);
      // Don't leave the form pointing at an output that no longer exists.
      if (productionTypeId === id) {
        setProductionTypeId(next[0]?.id ?? null);
      }
    } catch (err) {
      setProductionTypeError(
        err instanceof ApiError && err.status === 409 ? t('production.typeInUse') : t('production.typeDeleteError')
      );
    } finally {
      setConfirmDeleteProduces(null);
    }
  }

  /** Built-in outputs are stored under an English key and shown translated; a user-added one shows
   *  the name it was created with. */
  function productionTypeLabel(productionType: ProductionType): string {
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
  }

  /** The declared output, shown back once it is settled. A dash while the catalog is still on its
   *  way, or if it no longer holds the one this group was given. */
  function declaredProduceLabel(): string {
    const declared = productionTypes.find((productionType) => productionType.id === productionTypeId);
    return declared ? productionTypeLabel(declared) : '—';
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
    // A new group says what it produces up front; an older one that never did may still be edited
    // without declaring it, so it isn't stranded by a rule that came after it.
    if (!trimmedName || farmId == null || !livestockType || (!isEditing && productionTypeId == null)) return;

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
        const updated: Livestock = {
          id: editingItem!.id,
          // Settled at creation — the field above only shows it back.
          type: editingItem!.type,
          count,
          name: trimmedName,
          farmId,
          // A group that already declared its output keeps it — the field only shows it back.
          productionTypeId: producesLocked ? editingItem!.productionTypeId : productionTypeId,
        };
        await updateLivestock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestock({ type: livestockType, count, name: trimmedName, farmId, productionTypeId });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setFormError(await conflictMessage());
      } else {
        setFormError(err instanceof Error ? err.message : t('farm.saveError'));
      }
    } finally {
      setSaving(false);
    }
  }

  /**
   * Which rule the server refused on. The name is the usual one, but a group that declared what it
   * produces meanwhile — while this form still showed the choice as open — is the other; reads the
   * group back rather than guessing, and shows its declaration where that is what happened.
   */
  async function conflictMessage(): Promise<string> {
    if (isEditing && !producesLocked) {
      try {
        const current = await getLivestockItem(editingItem!.id);
        if (current.productionTypeId != null) {
          setProductionTypeId(current.productionTypeId);
          setProducesLocked(true);
          return t('production.producesFixed');
        }
      } catch {
        // Couldn't look: the name is the other way a save is refused, so say that.
      }
    }
    return t('farm.nameDuplicate');
  }

  return (
    <Modal open={open} onClose={onClose} className="livestock-form-modal">
      <h2 className="form-title">{isEditing ? t('farm.editLivestock') : t('farm.addLivestock')}</h2>

      <div className="form-fields">
        <div className="field">
          <label>{t('farm.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('farm.namePlaceholderLivestock')} />
        </div>

        {/* What the group is made of is settled when it is created: its animals and its whole
            production history were recorded as that kind, so an existing group shows its type back
            rather than offering to restate all of it as another animal. */}
        <div className="field">
          <label>{t('farm.type')}</label>
          {isEditing ? (
            <>
              <span className="limit-hint field-fixed-value">
                <img src={livestockImage(livestockType)} className="kind-chip-icon" alt="" />
                {livestockTypeLabel(livestockType, t)}
              </span>
              <span className="limit-hint">{t('farm.typeFixed')}</span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* What the group produces — every record it collects is counted under this, which is why
            it is settled here rather than chosen again on each batch. */}
        <div className="field">
          <label>{t('production.producesLabel')}</label>
          {producesLocked ? (
            <>
              <span className="limit-hint field-fixed-value">{declaredProduceLabel()}</span>
              <span className="limit-hint">{t('production.producesFixed')}</span>
            </>
          ) : (
            <>
              <KindPicker
                options={productionTypes.map((productionType) => ({
                  value: String(productionType.id),
                  label: productionTypeLabel(productionType),
                }))}
                selected={productionTypeId != null ? String(productionTypeId) : ''}
                onSelect={(value) => setProductionTypeId(Number(value))}
                onAddNew={handleAddProductionType}
                addPlaceholder={t('production.typePlaceholder')}
                loading={productionTypesLoading}
                onRemove={(value) => {
                  const productionType = productionTypes.find((pt) => String(pt.id) === value);
                  if (productionType) {
                    setConfirmDeleteProduces({ id: productionType.id, label: productionTypeLabel(productionType) });
                  }
                }}
                removeLabel={t('common.delete')}
              />
              <span className="limit-hint">{t('production.producesHint')}</span>
            </>
          )}
          {productionTypeError && <div className="error-banner">{productionTypeError}</div>}
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
        <button
          type="button"
          className="btn"
          onClick={handleSubmit}
          disabled={saving || noFarmAvailable || !livestockType || (!isEditing && productionTypeId == null)}
        >
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>

      <ConfirmDeleteModal
        open={!!confirmDeleteKind}
        name={confirmDeleteKind?.label ?? ''}
        onCancel={() => setConfirmDeleteKind(null)}
        onConfirm={confirmDeleteKindNow}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteProduces}
        name={confirmDeleteProduces?.label ?? ''}
        onCancel={() => setConfirmDeleteProduces(null)}
        onConfirm={confirmDeleteProducesNow}
      />
    </Modal>
  );
}
