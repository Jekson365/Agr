import { useEffect, useState } from 'react';

import { meatProductionTypeName } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { createAnimalProduction } from '@/services/animal-production-service';
import { ApiError } from '@/services/api-client';
import { getLivestockItem, updateLivestock } from '@/services/livestock-service';
import { ensureProductionType, getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import { buildProductionInput, isFormComplete, makeEmptyForm, type ProductionForm } from './production-form';
import { ProductionFormModal } from './production-form-modal';

type Props = {
  open: boolean;
  /** The animal being realized. The record is filed against it, and is what marks it realized. */
  animalId: number;
  /** The group it belongs to — its meat is what the record is collected under. */
  livestockId: number;
  onClose: () => void;
  /** Called once the realization is saved, so the page behind can read back which of its animals
   *  are realized now. */
  onSaved?: () => void;
};

/**
 * The realization window for one animal, standing on its own: it reads what it needs when it
 * opens, so any page holding an animal and its group can offer it without also loading the
 * group's production history.
 *
 * A realization is an ordinary production record with two things settled for it — it is filed
 * under the group's meat rather than what the group produces day to day, and it says so on the
 * way out, which is what closes the animal's record.
 */
export function LivestockRealizationModal({ open, animalId, livestockId, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  /** Null until the group, its meat type and the units are in hand — see {@link prepare}. */
  const [form, setForm] = useState<ProductionForm | null>(null);
  const [preparing, setPreparing] = useState(false);
  /** Why the window can't be opened at all: the group wouldn't load, or it has nothing to
   *  realize. Kept apart from `formError`, which is a save that didn't go through. */
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !livestockId || !animalId) return;
    prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, livestockId, animalId]);

  /**
   * Everything the form needs, read when the window opens rather than held by the page behind:
   * the group is read as it stands now, not as it was when the page loaded.
   */
  async function prepare() {
    setPreparing(true);
    setPrepareError(null);
    setFormError(null);
    setForm(null);
    try {
      const [group, typeList, unitList] = await Promise.all([
        getLivestockItem(livestockId),
        getProductionTypes(),
        getUnits(),
      ]);

      let types = typeList;
      let meatTypeId = group.meatProductionTypeId;
      // A group can reach here without its meat: one made before realization existed, or one
      // whose meat was created but never linked back to it. So the catalog is asked by name
      // before anything is created — the type is very often already sitting in it.
      if (meatTypeId == null) {
        const meatName = meatProductionTypeName(group.name, t);
        const wanted = meatName.trim().toLowerCase();
        const meatType =
          types.find((pt) => pt.name.trim().toLowerCase() === wanted) ?? (await ensureProductionType(meatName));
        meatTypeId = meatType.id;
        types = types.some((pt) => pt.id === meatType.id) ? types : [...types, meatType];

        // Link it so the next realization is a straight read. Best effort: the record itself only
        // needs the type's id, which is in hand either way, and a group that stays unlinked is
        // found by name again next time rather than being left unable to realize at all.
        try {
          await updateLivestock(group.id, { ...group, meatProductionTypeId: meatType.id });
        } catch {
          // Nothing to say to the farmer — the window they asked for opens regardless.
        }
      }

      setProductionTypes(types);
      setUnits(unitList);
      setForm({
        // One animal: the one whose card this was opened from.
        ...makeEmptyForm(1),
        productionTypeId: meatTypeId,
        unitId: unitList[0]?.id ?? null,
        isRealization: true,
      });
    } catch {
      setPrepareError(t('production.loadError'));
    } finally {
      setPreparing(false);
    }
  }

  async function handleSubmit() {
    if (!form || saving || !isFormComplete(form, false)) return;
    // Built as the animal's own record — animalId set, no group — which is what files it against
    // the animal and closes its record.
    const input = buildProductionInput(form, { editingRecord: null, isGroup: false, ownerId: animalId });
    if (!input) return;

    setSaving(true);
    setFormError(null);
    try {
      await createAnimalProduction(input);
      onSaved?.();
      onClose();
    } catch (err) {
      // The animal can have been realized from another page since this window opened.
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t('production.animalRealizedAlready')
          : err instanceof Error
            ? err.message
            : t('production.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  // The window is open before its contents are: showing the frame with a wait in it keeps the
  // press and what it opened tied together, rather than leaving the page silent for a moment.
  if (preparing || prepareError) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()}>
          <h2 className="form-title">{t('production.realizationTitle')}</h2>
          {preparing ? <div className="state-box">…</div> : <div className="error-banner">{prepareError}</div>}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <ProductionFormModal
      open
      // The animal's own record, not the group's — see handleSubmit.
      isGroup={false}
      editingRecord={null}
      form={form}
      onFormChange={setForm}
      productionTypes={productionTypes}
      units={units}
      saving={saving}
      error={formError}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
