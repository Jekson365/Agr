import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
// The stylesheets for every part of this view, loaded once here rather than by each part.
import '@/components/farm/kind-picker.css';
import '@/components/farm/record-list.css';
import '@/components/farm/search-filter.css';
import '@/pages/report-page.css';
import { meatProductionTypeName } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import {
  createAnimalProduction,
  deleteAnimalProduction,
  getAllAnimalProductions,
  getAnimalProductions,
  getLivestockProductions,
  updateAnimalProduction,
} from '@/services/animal-production-service';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestockItem, updateLivestock } from '@/services/livestock-service';
import { deleteProductionMovement, getProductionMovements } from '@/services/production-movement-service';
import { createProductionType, getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import { ProductionFilters } from './production-filters';
import { buildProductionInput, formFromRecord, isFormComplete, makeEmptyForm, type ProductionForm } from './production-form';
import { ProductionFormModal } from './production-form-modal';
import { makeDefaultPeriod, type Period } from './production-period';
import { animalsWithOwnRecords, buildProductionRows } from './production-rows';
import { ProductionTable, type RowTarget } from './production-table';

type Props =
  | {
      /** The animal (LivestockDetail) whose production records these are. */
      target: 'animal';
      animalId: number;
      /** The group the animal belongs to — what it produces is declared there, and that is what
       *  its records are collected under. */
      livestockId: number;
    }
  | {
      /** The livestock group whose combined production records these are. */
      target: 'livestock';
      livestockId: number;
      /** The group's current head count, used to prefill the "animals counted" field. */
      animalCount: number;
      /** Called when a realization has moved the group's head count, so the page holding it can
       *  read it back — this view refreshes its own copy, not the caller's. */
      onHeadcountChange?: () => void;
    };

/**
 * Production history for either a single animal or a whole livestock group: milking/
 * egg-collection/etc. batches with quantity, unit, and optional pricing/collector details, plus
 * an "add new record" button. Mirrors the mobile AnimalProductionView.
 *
 * Owns the state and the server calls; the filter panel, the table and the form are in this
 * folder, and the rules for deriving what they show are in the modules beside them.
 */
export function AnimalProductionView(props: Props) {
  const { t } = useLanguage();
  const isGroup = props.target === 'livestock';
  const ownerId = isGroup ? props.livestockId : props.animalId;
  const defaultAnimalCount = isGroup ? props.animalCount : 1;
  const livestockId = props.livestockId;

  const [records, setRecords] = useState<AnimalProduction[]>([]);
  // Records added on one specific animal of this group (group view only), shown merged into
  // the table and toggleable, since they can crowd out the group-level batches.
  const [singleRecords, setSingleRecords] = useState<AnimalProduction[]>([]);
  // Marketplace sales of the production types this group produces (group view only). Sales
  // aren't attributed to a group — they deduct a type/unit balance — so they're shown on every
  // group page whose records include that type, as read-only rows.
  const [saleMovements, setSaleMovements] = useState<ProductionMovement[]>([]);
  const [animalCodeById, setAnimalCodeById] = useState<Map<number, string>>(new Map());
  const [showSingles, setShowSingles] = useState(true);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  /**
   * What the group produces. Every record here is collected under it — it is declared once, when
   * the group is added, so this view reads it rather than offering the choice again.
   * Null for a group that predates that and has collected nothing: it declares one before its
   * first record, which is why adding is closed off until it does.
   */
  const [producedTypeId, setProducedTypeId] = useState<number | null>(null);
  /** The group itself, kept for its animal kind and the meat type a realization is filed under. */
  const [group, setGroup] = useState<Livestock | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [period, setPeriod] = useState<Period>(makeDefaultPeriod);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [animalFilter, setAnimalFilter] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AnimalProduction | null>(null);
  const [form, setForm] = useState<ProductionForm>(() => makeEmptyForm(defaultAnimalCount));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RowTarget | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<RowTarget | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [recordList, typeList, unitList, groupItem, detailList, allProductions, movementList] = await Promise.all([
        isGroup ? getLivestockProductions(ownerId) : getAnimalProductions(ownerId),
        getProductionTypes(),
        getUnits(),
        getLivestockItem(livestockId),
        isGroup ? getLivestockDetails(ownerId) : Promise.resolve<LivestockDetail[]>([]),
        isGroup ? getAllAnimalProductions() : Promise.resolve<AnimalProduction[]>([]),
        isGroup ? getProductionMovements() : Promise.resolve<ProductionMovement[]>([]),
      ]);
      setRecords(recordList);
      setProductionTypes(typeList);
      setUnits(unitList);
      setProducedTypeId(groupItem.productionTypeId);
      setGroup(groupItem);
      if (isGroup) {
        const codeById = new Map(detailList.map((d) => [d.id, d.code]));
        setAnimalCodeById(codeById);
        const singles = allProductions.filter((p) => p.animalId != null && codeById.has(p.animalId));
        setSingleRecords(singles);

        // Only sales of type/unit pairs this group actually collects are relevant here.
        const pairs = new Set([...recordList, ...singles].map((r) => `${r.productionTypeId}:${r.unitId}`));
        setSaleMovements(
          movementList.filter((m) => m.source === 'Market' && pairs.has(`${m.productionTypeId}:${m.unitId}`))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /** Tells the page above that the group's head count moved. Group pages only — the prop is
   *  theirs, and a single animal's page has no count to correct. */
  function headcountChanged() {
    if (props.target === 'livestock') {
      props.onHeadcountChange?.();
    }
  }

  function openAdd() {
    if (producedTypeId == null) return;
    setEditingRecord(null);
    setForm({
      // The group as last read, not the count this view was mounted with: a realization since
      // then took animals off it, and prefilling a herd that no longer exists is how a milking
      // ends up recorded against more animals than the farm has.
      ...makeEmptyForm(isGroup ? (group?.count ?? defaultAnimalCount) : 1),
      // Not a choice here: the batch is collected under what the group produces.
      productionTypeId: producedTypeId,
      unitId: units[0]?.id ?? null,
    });
    setFormError(null);
    setFormOpen(true);
  }

  /**
   * A realization: the same form and the same save path as a record, with two things settled for
   * it. It is filed under the group's own meat rather than what the group produces, and it says
   * so on the way out, which is what has the server take its animals off the group.
   *
   * The count defaults to 1 rather than the whole herd — the add form covers every animal because
   * they all contributed to a milking, but realizing the entire group by pressing a button once
   * is not a default anyone wants.
   */
  async function openRealization() {
    // Also guarded on the button. Checked again here because the count can have fallen to zero
    // since this page loaded — the form would open onto a save the server is bound to refuse.
    if (!group || group.count < 1) return;

    const meatTypeId = group.meatProductionTypeId ?? (await createMeatTypeForGroup());
    if (meatTypeId == null) {
      setError(t('production.saveError'));
      return;
    }

    setEditingRecord(null);
    setForm({
      ...makeEmptyForm(1),
      productionTypeId: meatTypeId,
      unitId: units[0]?.id ?? null,
      isRealization: true,
    });
    setFormError(null);
    setFormOpen(true);
  }

  /**
   * The meat type for a group that has none — every group made before realization existed. Named
   * after the group in the current language, the same as a new group's, and linked to the group
   * so the next realization finds it rather than making a second one.
   */
  async function createMeatTypeForGroup(): Promise<number | null> {
    if (!group) return null;
    try {
      const created = await createProductionType(meatProductionTypeName(group.name, t));
      await updateLivestock(group.id, { ...group, meatProductionTypeId: created.id });
      setGroup({ ...group, meatProductionTypeId: created.id });
      setProductionTypes((prev) => (prev.some((pt) => pt.id === created.id) ? prev : [...prev, created]));
      return created.id;
    } catch {
      return null;
    }
  }

  function openEdit(record: AnimalProduction) {
    setEditingRecord(record);
    setForm(formFromRecord(record));
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (saving || !isFormComplete(form, isGroup)) return;
    const input = buildProductionInput(form, { editingRecord, isGroup, ownerId });
    if (!input) return;

    setSaving(true);
    setFormError(null);
    try {
      if (editingRecord) {
        await updateAnimalProduction(editingRecord.id, {
          ...input,
          id: editingRecord.id,
          createdAt: editingRecord.createdAt,
        });
        const apply = (prev: AnimalProduction[]) => prev.map((r) => (r.id === editingRecord.id ? { ...r, ...input } : r));
        // A single-animal record opened from the group view lives in the other list.
        if (editingRecord.animalId != null && isGroup) {
          setSingleRecords(apply);
        } else {
          setRecords(apply);
        }
      } else {
        const created = await createAnimalProduction(input);
        setRecords((prev) => [...prev, created]);
      }
      setFormOpen(false);

      // A realization moved the group's headcount on the server. Read the page back rather than
      // guessing the new count here — deleting one puts the animals back too, and one place that
      // re-reads is easier to trust than three that each do their own arithmetic.
      if (input.isRealization) {
        await load();
        headcountChanged();
      }
    } catch (err) {
      // The group can be short of animals if it was realized elsewhere since this page loaded.
      setFormError(
        err instanceof ApiError && err.status === 409 && input.isRealization
          ? t('production.realizationTooMany')
          : err instanceof Error
            ? err.message
            : t('production.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  /** Undo a recorded sale: the quantity goes back into the balance. */
  async function confirmRollbackSale() {
    if (!confirmRollback) return;
    const { id } = confirmRollback;
    try {
      await deleteProductionMovement(id);
      setSaleMovements((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmRollback(null);
    }
  }

  async function confirmDeleteRecord() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    // Read before it is gone: deleting a realization gives the group its animals back, and the
    // headcount on screen has to follow.
    const wasRealization = [...records, ...singleRecords].some((r) => r.id === id && r.isRealization);
    try {
      await deleteAnimalProduction(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSingleRecords((prev) => prev.filter((r) => r.id !== id));
      if (wasRealization) {
        await load();
        headcountChanged();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  if (loading) {
    return <div className="state-box">…</div>;
  }

  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  const rows = buildProductionRows(
    { records, singleRecords, saleMovements, showSingles, isGroup },
    { period, typeFilter, animalFilter }
  );
  const hasAnyRecords = records.length > 0 || singleRecords.length > 0 || saleMovements.length > 0;

  return (
    <>
      <ProductionFilters
        open={filtersOpen}
        onToggleOpen={() => setFiltersOpen((prev) => !prev)}
        period={period}
        onPeriodChange={setPeriod}
        productionTypes={productionTypes}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        animals={isGroup ? animalsWithOwnRecords(singleRecords, animalCodeById) : []}
        animalFilter={animalFilter}
        onAnimalFilterChange={setAnimalFilter}
        singles={
          isGroup && singleRecords.length > 0
            ? {
                shown: showSingles,
                onToggle: () =>
                  setShowSingles((prev) => {
                    // Hiding the individual records makes an animal filter meaningless.
                    if (prev) setAnimalFilter(null);
                    return !prev;
                  }),
              }
            : undefined
        }
      />

      {rows.length === 0 ? (
        <p className="empty-state">{hasAnyRecords ? t('report.noResultsProduction') : t('production.empty')}</p>
      ) : (
        <ProductionTable
          rows={rows}
          isGroup={isGroup}
          typeById={typeById}
          unitById={unitById}
          animalCodeById={animalCodeById}
          onEdit={openEdit}
          onDelete={setConfirmDelete}
          onRollbackSale={setConfirmRollback}
        />
      )}

      {error && <div className="error-banner">{t('production.loadError')}</div>}

      {/* A record is collected under what the group produces, so there is nothing to record until
          the group says what that is — see producedTypeId. */}
      <div className="production-actions">
        {producedTypeId == null ? (
          <p className="limit-hint">{t('production.producesMissing')}</p>
        ) : (
          <button type="button" className="add-button" onClick={openAdd}>
            + {t('production.addRecord')}
          </button>
        )}

        {/* Realization stands apart from what the group produces: a herd can be realized whether
            or not it has declared an output, so this is not behind the check above. Group pages
            only — it takes animals off a group, which a single animal's page has none of. */}
        {isGroup && group && (
          <>
            {/* An emptied group has nothing left to take. The server refuses it too, but a
                button that can only fail is not worth offering. */}
            <button
              type="button"
              className="secondary-button"
              onClick={openRealization}
              disabled={group.count < 1}
              title={group.count < 1 ? t('production.realizationNoAnimals') : undefined}
            >
              {t('production.realization')}
            </button>
            {group.count < 1 && <span className="limit-hint">{t('production.realizationNoAnimals')}</span>}
          </>
        )}
      </div>

      <ProductionFormModal
        open={formOpen}
        isGroup={isGroup}
        editingRecord={editingRecord}
        form={form}
        onFormChange={setForm}
        productionTypes={productionTypes}
        units={units}
        saving={saving}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteRecord}
      />

      <ConfirmDeleteModal
        open={!!confirmRollback}
        name={confirmRollback?.label ?? ''}
        body={t('production.rollbackSaleBody')}
        onCancel={() => setConfirmRollback(null)}
        onConfirm={confirmRollbackSale}
      />
    </>
  );
}
