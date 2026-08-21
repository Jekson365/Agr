import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { LIVESTOCK_KIND_CATALOG } from '@/components/farm/livestock/livestock-kind-catalog';
import { Modal } from '@/components/ui/modal';
import { MultiSelect } from '@/components/ui/multi-select';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { isPlanLimitError } from '@/config/plan-benefits';
import { meatProductionTypeName, PRODUCTION_TYPE_LABEL_KEY, RETIRED_PRODUCTION_TYPE_NAMES } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLivestock, updateLivestock } from '@/services/livestock-service';
import { ensureProductionType, getProductionTypes } from '@/services/production-type-service';
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
  const [productionTypeIds, setProductionTypeIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;
  const farmId = editingItem?.farmId ?? farms[0]?.id ?? null;
  const noFarmAvailable = farmId == null;

  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setNameInput(editingItem?.name ?? '');
    setCountInput(editingItem ? String(editingItem.count) : '');
    setLivestockType(editingItem?.type ?? '');
    setProductionTypeIds(editingItem?.productionTypeIds ?? []);
    loadProductionTypes(editingItem?.productionTypeIds ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingItem]);

  async function loadProductionTypes(preset: number[]) {
    setProductionTypesLoading(true);
    try {
      const list = await getProductionTypes();
      // Meat and leather are not what a herd yields over and over, so they are not on offer. A
      // group already declaring one keeps it: the list is what the picker reads its labels from,
      // and dropping it would blank the entry out.
      const offered = list.filter(
        (productionType) =>
          preset.includes(productionType.id) || !RETIRED_PRODUCTION_TYPE_NAMES.has(productionType.name)
      );
      setProductionTypes(offered);
      setProductionTypeIds(preset);
    } catch {
      setProductionTypes([]);
      setProductionTypeIds(preset);
    } finally {
      setProductionTypesLoading(false);
    }
  }

  /**
   * The production type a realization of this group will be recorded under — this group's own
   * meat, named after it, so one herd's realizations are never filed as another's.
   *
   * Created with the group rather than on the first realization, which is what the group's
   * meatProductionTypeId then points at. Safe to call again: an existing type of that name is
   * taken as this group's rather than refused — the name can be left over from a group creation
   * that failed after making it, and a group saved unlinked is a group that cannot realize.
   * Still best effort — a group that cannot get one is worth saving, and the realization window
   * looks the name up again on demand.
   */
  async function ensureMeatProductionType(groupName: string): Promise<number | null> {
    try {
      const meatType = await ensureProductionType(meatProductionTypeName(groupName, t));
      return meatType.id;
    } catch {
      return null;
    }
  }

  function productionTypeLabel(productionType: ProductionType): string {
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
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
          // Every field but the name and the farm is settled at creation — the ones above only
          // show them back, and the server ignores them on an update in any case. Spread rather
          // than listed one by one so a field added to the group later travels with it: the
          // removed mark is one such, and dropping it here would read as un-removing the group.
          ...editingItem!,
          name: trimmedName,
          farmId,
          productionTypeIds,
          productionTypeId: productionTypeIds[0] ?? null,
        };
        await updateLivestock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestock({
          type: livestockType,
          count,
          name: trimmedName,
          farmId,
          productionTypeId: productionTypeIds[0] ?? null,
          productionTypeIds,
          meatProductionTypeId: await ensureMeatProductionType(trimmedName),
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
   * Which rule the server refused on. A new group can only clash on its name; an edit cannot
   * change the name or the animal at all, so the one rule left for it to hit is an output being
   * dropped that the group has already collected under.
   */
  function conflictMessage(): string {
    return isEditing ? t('production.produceInUse') : t('farm.nameDuplicate');
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
            <>
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder={t('farm.namePlaceholderLivestock')}
              />
              <span className="limit-hint">
                {nameInput.trim()
                  ? t('farm.meatTypeAutoNamed', { name: meatProductionTypeName(nameInput, t) })
                  : t('farm.meatTypeAuto')}
              </span>
            </>
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
            size="large"
            /* Adding an animal kind from here stays switched off, as it was on the chip row. */
            allowAdd={false}
          />
        )}

        {/* Everything the group produces. A herd yields more than one thing — milk and wool off
            the same flock — so each record it collects names one of these. Another output can be
            taken on at any time; one already collected under cannot be dropped, which the server
            refuses rather than this form. */}
        <div className="field">
          <label>{t('production.producesLabel')}</label>
          {productionTypesLoading ? (
            <span className="limit-hint">…</span>
          ) : (
            <MultiSelect
              options={productionTypes.map((productionType) => ({
                value: String(productionType.id),
                label: productionTypeLabel(productionType),
              }))}
              selected={productionTypeIds.map(String)}
              onChange={(values) => setProductionTypeIds(values.map(Number))}
              placeholder={t('production.producesPlaceholder')}
              searchPlaceholder={t('production.producesSearchPlaceholder')}
              emptyText={t('production.producesEmpty')}
              size="large"
            />
          )}
          <span className="limit-hint">{t('production.producesHint')}</span>
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

    </Modal>
  );
}
