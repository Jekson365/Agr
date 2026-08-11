import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { kindDeleteMessage } from '@/components/farm/kind-delete-message';
import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { KindDropdown } from '@/components/farm/kind-dropdown';
import { type KindOption } from '@/components/farm/kind-picker';
import { LIVESTOCK_KIND_CATALOG } from '@/components/farm/livestock/livestock-kind-catalog';
import { Modal } from '@/components/ui/modal';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { meatProductionTypeName, PRODUCTION_TYPE_LABEL_KEY, RETIRED_PRODUCTION_TYPE_NAMES } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLivestock, updateLivestock } from '@/services/livestock-service';
import { createProductionType, deleteProductionType, getProductionTypes } from '@/services/production-type-service';
import type { Farm } from '@/types/farm';
import type { AnimalType, Livestock } from '@/types/livestock';
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

  const [nameInput, setNameInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [livestockType, setLivestockType] = useState<AnimalType>('');
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [productionTypesLoading, setProductionTypesLoading] = useState(true);
  const [productionTypeId, setProductionTypeId] = useState<number | null>(null);
  /**
   * What the group produces is chosen when the group is created and never again — the records it
   * collects are counted under it, so an edit that moved it would recount them as something they
   * were never collected as. Every edit shows it back rather than offering the choice, including
   * for a group that was created without declaring one at all.
   */
  const producesLocked = editingItem != null;
  const [productionTypeError, setProductionTypeError] = useState<string | null>(null);
  const [confirmDeleteProduces, setConfirmDeleteProduces] = useState<{ id: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;
  const farmId = editingItem?.farmId ?? farms[0]?.id ?? null;
  const noFarmAvailable = farmId == null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setProductionTypeError(null);
    setNameInput(editingItem?.name ?? '');
    setCountInput(editingItem ? String(editingItem.count) : '');
    setLivestockType(editingItem?.type ?? '');
    setProductionTypeId(editingItem?.productionTypeId ?? null);
    loadProductionTypes(editingItem?.productionTypeId ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem]);

  async function loadProductionTypes(preset: number | null) {
    setProductionTypesLoading(true);
    try {
      const list = await getProductionTypes();
      // Meat and leather are not what a herd yields over and over, so they are not on offer.
      // The group being edited keeps the one it already declares, though — that value is shown
      // back as fixed text read out of this same list, and dropping it would blank it out.
      const offered = list.filter(
        (productionType) => productionType.id === preset || !RETIRED_PRODUCTION_TYPE_NAMES.has(productionType.name)
      );
      setProductionTypes(offered);
      // Nothing preselected: a group is not required to say what it produces, and defaulting to
      // whichever output happened to sort first is how a herd ends up declared as something
      // nobody chose — settled for good, since the choice cannot be changed once records exist.
      setProductionTypeId(preset);
    } catch {
      setProductionTypes([]);
      setProductionTypeId(preset);
    } finally {
      setProductionTypesLoading(false);
    }
  }

  /**
   * The production type a realization of this group will be recorded under — this group's own
   * meat, named after it, so one herd's realizations are never filed as another's.
   *
   * Created with the group rather than on the first realization, which is what the group's
   * meatProductionTypeId then points at. Safe to call again: the server returns the existing type
   * when the name is already taken. Best effort — a group that cannot get one is still worth
   * saving, and the realization form makes one on demand.
   */
  async function ensureMeatProductionType(groupName: string): Promise<number | null> {
    try {
      const created = await createProductionType(meatProductionTypeName(groupName, t));
      return created.id;
    } catch {
      return null;
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

  function productionTypeLabel(productionType: ProductionType): string {
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
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
      if (productionTypeId === id) {
        setProductionTypeId(null);
      }
    } catch (err) {
      setProductionTypeError(kindDeleteMessage(err, t));
    } finally {
      setConfirmDeleteProduces(null);
    }
  }

  /** The declared output, shown back once it is settled. A dash while the catalog is still on its
   *  way, or if it no longer holds the one this group was given. */
  function declaredProduceLabel(): string {
    const declared = productionTypes.find((productionType) => productionType.id === productionTypeId);
    return declared ? productionTypeLabel(declared) : '—';
  }

  async function handleSubmit() {
    // The name is settled at creation, so an edit sends back the one the group already has.
    const trimmedName = isEditing ? editingItem!.name : nameInput.trim();
    if (!trimmedName || farmId == null || !livestockType) return;

    // Groups are identified by name across the app (production, balances, reports), so two
    // groups sharing one would be indistinguishable. Only a new group can collide — an existing
    // one is saving the name it already had. The server enforces this too.
    const nameTaken =
      !isEditing && existingItems.some((item) => item.name.trim().toLowerCase() === trimmedName.toLowerCase());
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
          // Every one of these is settled at creation — the fields above only show them back,
          // and the server ignores them on an update in any case.
          name: trimmedName,
          type: editingItem!.type,
          count: editingItem!.count,
          farmId,
          productionTypeId: editingItem!.productionTypeId,
          // Settled with the group and never edited here; carried through so saving the form
          // doesn't unlink the meat a realization is recorded under.
          meatProductionTypeId: editingItem!.meatProductionTypeId,
          // Owned by the group's realization records — carried so the object is whole, and
          // ignored by the server for the same reason it is not editable here.
          isRealized: editingItem!.isRealized,
        };
        await updateLivestock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestock({
          type: livestockType,
          count,
          name: trimmedName,
          farmId,
          productionTypeId,
          meatProductionTypeId: await ensureMeatProductionType(trimmedName),
          // A new group has been realized as much as it has produced.
          isRealized: false,
        });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      if (isPlanLimitError(err) && onLimitReached) {
        onLimitReached(err.message);
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setFormError(conflictMessage());
      } else {
        setFormError(err instanceof Error ? err.message : t('farm.saveError'));
      }
    } finally {
      setSaving(false);
    }
  }

  /**
   * Which rule the server refused on. With the animal, the count and the output all settled at
   * creation, a duplicate name is the only one an edit can still hit.
   */
  function conflictMessage(): string {
    return t('farm.nameDuplicate');
  }

  return (
    <Modal open={open} onClose={onClose} className="livestock-form-modal">
      <h2 className="form-title">{isEditing ? t('farm.editLivestock') : t('farm.addLivestock')}</h2>

      <div className="modal-form-grid">
        {/* Settled at creation like everything below it. The group is referred to by name across
            production, balances and the reports — and its meat carries the name it was created
            with — so renaming it would leave all of that pointing at something else. */}
        <div className="field">
          <label>{t('farm.name')}</label>
          {isEditing ? (
            <>
              <span className="limit-hint field-fixed-value">{editingItem!.name}</span>
              <span className="limit-hint">{t('farm.nameFixed')}</span>
            </>
          ) : (
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('farm.namePlaceholderLivestock')} />
          )}
        </div>

        {/* What the group is made of is settled when it is created: its animals and its whole
            production history were recorded as that kind, so an existing group shows its type back
            rather than offering to restate all of it as another animal. */}
        {isEditing ? (
          <div className="field">
            <label>{t('farm.type')}</label>
            <span className="limit-hint field-fixed-value">
              <img src={livestockImage(livestockType)} className="kind-chip-icon" alt="" />
              {livestockTypeLabel(livestockType, t)}
            </span>
            <span className="limit-hint">{t('farm.typeFixed')}</span>
          </div>
        ) : (
          /* The same field the stock form uses, in its dropdown form: one field tall with a search
             box, rather than a chip row that grows with the catalog. It renders its own .field, so
             it is a grid cell in its own right rather than being wrapped in a second one. */
          <KindCatalogField
            open={open}
            catalog={LIVESTOCK_KIND_CATALOG}
            value={livestockType}
            onChange={setLivestockType}
            preset={null}
            labelText={t('farm.type')}
            addPlaceholder={t('farm.newLivestockTypePlaceholder')}
            variant="dropdown"
            /* Adding an animal kind from here stays switched off, as it was on the chip row. */
            allowAdd={false}
          />
        )}

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
              {/* The stock form's dropdown, over production types instead of crop kinds. Keyed by
                  id, so it cannot go through KindCatalogField, which is name-keyed. */}
              <KindDropdown
                options={productionTypes.map((productionType) => ({
                  value: String(productionType.id),
                  label: productionTypeLabel(productionType),
                }))}
                selected={productionTypeId != null ? String(productionTypeId) : ''}
                onSelect={(value) => setProductionTypeId(value ? Number(value) : null)}
                onAddNew={handleAddProductionType}
                addPlaceholder={t('production.typePlaceholder')}
                /* Adding an output from here is switched off, as it is for the animal kind above:
                   the catalog is settled, and one invented mid-form lands as a near-duplicate of
                   an entry already in it. Flip to true to bring back both the "New type" button
                   and the add row under a fruitless search. */
                allowAdd={false}
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

        {/* Settled at creation, like the animal and the output above it. From then on the count is
            what the group's movement ledger has left it at, so a figure typed here would silently
            disagree with the history that produced it. */}
        <div className="field">
          <label>{t('farm.count')}</label>
          {isEditing ? (
            <>
              <span className="limit-hint field-fixed-value">{editingItem!.count}</span>
              <span className="limit-hint">{t('farm.countFixed')}</span>
            </>
          ) : (
            <input
              type="number"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              placeholder={t('farm.countPlaceholder')}
            />
          )}
        </div>

        {noFarmAvailable && <p className="limit-hint field-full">{t('farm.noFarmland')}</p>}

        {formError && <div className="error-banner field-full">{formError}</div>}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className="btn"
          onClick={handleSubmit}
          disabled={saving || noFarmAvailable || !livestockType}
        >
          {isEditing ? t('common.save') : t('common.add')}
        </button>
      </div>


      <ConfirmDeleteModal
        open={!!confirmDeleteProduces}
        name={confirmDeleteProduces?.label ?? ''}
        onCancel={() => setConfirmDeleteProduces(null)}
        onConfirm={confirmDeleteProducesNow}
      />
    </Modal>
  );
}
