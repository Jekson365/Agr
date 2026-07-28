import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import '@/components/farm/kind-picker.css';
import '@/components/farm/record-list.css';
import '@/components/farm/search-filter.css';
import '@/pages/report-page.css';
import { FilterIcon } from '@/components/icons/misc-icons';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import {
  formatLocalizedIsoDate,
  formatLocalizedIsoDay,
  parseIsoDate,
  parseIsoDay,
  todayIsoDate,
} from '@/components/ui/date-utils';
import { DateField } from '@/components/ui/date-field';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import {
  createAnimalProduction,
  deleteAnimalProduction,
  getAllAnimalProductions,
  getAnimalProductions,
  getLivestockProductions,
  updateAnimalProduction,
} from '@/services/animal-production-service';
import { ApiError } from '@/services/api-client';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { deleteProductionMovement, getProductionMovements } from '@/services/production-movement-service';
import { createProductionType, deleteProductionType, getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { LivestockDetail } from '@/types/livestock-detail';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';

type Props =
  | {
      /** The animal (LivestockDetail) whose production records these are. */
      target: 'animal';
      animalId: number;
    }
  | {
      /** The livestock group whose combined production records these are. */
      target: 'livestock';
      livestockId: number;
      /** The group's current head count, used to prefill the "animals counted" field. */
      animalCount: number;
    };

type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
type Quarter = 1 | 2 | 3 | 4;

const PERIOD_OPTIONS: { value: PeriodMode; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.periodAll' },
  { value: 'year', labelKey: 'report.periodYear' },
  { value: 'quarter', labelKey: 'report.periodQuarter' },
  { value: 'custom', labelKey: 'report.periodCustom' },
];

const QUARTER_OPTIONS: { value: Quarter; labelKey: string }[] = [
  { value: 1, labelKey: 'report.quarterQ1' },
  { value: 2, labelKey: 'report.quarterQ2' },
  { value: 3, labelKey: 'report.quarterQ3' },
  { value: 4, labelKey: 'report.quarterQ4' },
];

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

function makeEmptyForm(animalCount: number) {
  return {
    productionTypeId: null as number | null,
    collectionDate: todayIsoDate(),
    quantity: '',
    unitId: null as number | null,
    animalCount: String(animalCount),
    quality: '',
    pricePerUnit: '',
    totalPrice: '',
    totalPriceEdited: false,
    collectedBy: '',
    batchNumber: '',
    notes: '',
  };
}

function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Production history for either a single animal or a whole livestock group: milking/
 * egg-collection/etc. batches with quantity, unit, and optional pricing/collector details, plus
 * an "add new record" button. Mirrors the mobile AnimalProductionView.
 */
export function AnimalProductionView(props: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isGroup = props.target === 'livestock';
  const ownerId = isGroup ? props.livestockId : props.animalId;
  const defaultAnimalCount = isGroup ? props.animalCount : 1;

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
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [quarter, setQuarter] = useState<Quarter>(() => (Math.floor(new Date().getMonth() / 3) + 1) as Quarter);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<number | null>(null);
  const [animalFilter, setAnimalFilter] = useState<number | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AnimalProduction | null>(null);
  const [form, setForm] = useState(() => makeEmptyForm(defaultAnimalCount));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);
  const [confirmRollback, setConfirmRollback] = useState<{ id: number; label: string } | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<{ id: number; label: string } | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  useEffect(() => {
    if (!ownerId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [recordList, typeList, unitList, detailList, allProductions, movementList] = await Promise.all([
        isGroup ? getLivestockProductions(ownerId) : getAnimalProductions(ownerId),
        getProductionTypes(),
        getUnits(),
        isGroup ? getLivestockDetails(ownerId) : Promise.resolve<LivestockDetail[]>([]),
        isGroup ? getAllAnimalProductions() : Promise.resolve<AnimalProduction[]>([]),
        isGroup ? getProductionMovements() : Promise.resolve<ProductionMovement[]>([]),
      ]);
      setRecords(recordList);
      setProductionTypes(typeList);
      setUnits(unitList);
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

  async function handleAddProductionType(name: string): Promise<KindOption | null> {
    setTypeError(null);

    // A name is a duplicate if it matches an existing type's raw name OR its localized label —
    // built-in types are stored under English keys ("Milk") but displayed translated ("რძე"),
    // and either spelling would show up as a second identical entry in the picker.
    const candidate = name.trim().toLowerCase();
    const isDuplicate = productionTypes.some((pt) => {
      const label = t(PRODUCTION_TYPE_LABEL_KEY[pt.name] ?? pt.name);
      return pt.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setTypeError(t('production.typeDuplicate'));
      return null;
    }

    try {
      const created = await createProductionType(name);
      setProductionTypes((prev) => (prev.some((pt) => pt.id === created.id) ? prev : [...prev, created]));
      return { value: String(created.id), label: t(PRODUCTION_TYPE_LABEL_KEY[created.name] ?? created.name) };
    } catch (err) {
      // The server rejects names that already exist (e.g. added from another session).
      setTypeError(err instanceof ApiError && err.status === 409 ? t('production.typeDuplicate') : t('production.typeSaveError'));
      return null;
    }
  }

  async function confirmDeleteProductionType() {
    if (!confirmDeleteType) return;
    const { id } = confirmDeleteType;

    setTypeError(null);
    try {
      await deleteProductionType(id);
      setProductionTypes((prev) => prev.filter((pt) => pt.id !== id));
      // Don't leave the form pointing at a type that no longer exists.
      setForm((prev) => (prev.productionTypeId === id ? { ...prev, productionTypeId: null } : prev));
    } catch (err) {
      // The server refuses to delete a type that existing records still reference.
      setTypeError(err instanceof ApiError && err.status === 409 ? t('production.typeInUse') : t('production.typeDeleteError'));
    } finally {
      setConfirmDeleteType(null);
    }
  }

  function setField<K extends keyof ReturnType<typeof makeEmptyForm>>(key: K, value: ReturnType<typeof makeEmptyForm>[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setQuantityOrPrice(key: 'quantity' | 'pricePerUnit', value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!prev.totalPriceEdited) {
        const quantity = parseFloat(next.quantity);
        const pricePerUnit = parseFloat(next.pricePerUnit);
        // Clearing either side clears the total too — leaving the last computed figure behind
        // would save a total that no longer matches the quantity or price it came from.
        next.totalPrice = quantity > 0 && pricePerUnit > 0 ? String(Math.round(quantity * pricePerUnit * 100) / 100) : '';
      }
      return next;
    });
  }

  const canSubmit =
    form.productionTypeId != null &&
    form.unitId != null &&
    !!form.collectionDate &&
    parseFloat(form.quantity) > 0 &&
    (!isGroup || parseInt(form.animalCount, 10) > 0) &&
    !saving;

  function openAdd() {
    setEditingRecord(null);
    setForm({
      ...makeEmptyForm(defaultAnimalCount),
      productionTypeId: productionTypes[0]?.id ?? null,
      unitId: units[0]?.id ?? null,
    });
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(record: AnimalProduction) {
    setEditingRecord(record);
    setForm({
      productionTypeId: record.productionTypeId,
      collectionDate: toDateInputValue(record.collectionDate),
      quantity: String(record.quantity),
      unitId: record.unitId,
      animalCount: String(record.animalCount),
      quality: record.quality ?? '',
      pricePerUnit: record.pricePerUnit != null ? String(record.pricePerUnit) : '',
      totalPrice: record.totalPrice != null ? String(record.totalPrice) : '',
      // Treat the stored total as hand-entered only when it isn't just quantity × unit price.
      // Otherwise editing the quantity would keep the old total, and every value and share in
      // the reports would go on using a figure that no longer matches the record.
      totalPriceEdited:
        record.totalPrice != null &&
        (record.pricePerUnit == null ||
          Math.abs(record.totalPrice - record.quantity * record.pricePerUnit) > 0.005),
      collectedBy: record.collectedBy ?? '',
      batchNumber: record.batchNumber ?? '',
      notes: record.notes ?? '',
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (!canSubmit || form.productionTypeId == null || form.unitId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      // An edited record keeps its own owner — a single-animal record opened from the group
      // view must not be silently converted into a group-level one.
      const isSingleEdit = editingRecord?.animalId != null;
      const input = {
        animalId: editingRecord ? editingRecord.animalId : isGroup ? null : ownerId,
        livestockId: editingRecord ? editingRecord.livestockId : isGroup ? ownerId : null,
        animalCount: isSingleEdit ? 1 : isGroup ? parseInt(form.animalCount, 10) : 1,
        productionTypeId: form.productionTypeId,
        collectionDate: form.collectionDate,
        quantity: parseFloat(form.quantity),
        unitId: form.unitId,
        quality: form.quality.trim() || null,
        pricePerUnit: parseFloatOrNull(form.pricePerUnit),
        totalPrice: parseFloatOrNull(form.totalPrice),
        collectedBy: form.collectedBy.trim() || null,
        batchNumber: form.batchNumber.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingRecord) {
        await updateAnimalProduction(editingRecord.id, {
          ...input,
          id: editingRecord.id,
          createdAt: editingRecord.createdAt,
        });
        const apply = (prev: AnimalProduction[]) => prev.map((r) => (r.id === editingRecord.id ? { ...r, ...input } : r));
        if (isSingleEdit && isGroup) {
          setSingleRecords(apply);
        } else {
          setRecords(apply);
        }
      } else {
        const created = await createAnimalProduction(input);
        setRecords((prev) => [...prev, created]);
      }
      setFormOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('production.saveError'));
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
    try {
      await deleteAnimalProduction(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSingleRecords((prev) => prev.filter((r) => r.id !== id));
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

  function typeLabel(productionType?: ProductionType) {
    if (!productionType) return '';
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
  }

  function unitLabel(unit?: Unit) {
    if (!unit) return '';
    return t(UNIT_LABEL_KEY[unit.name] ?? unit.name);
  }

  /** `dayOnly` for fields that carry a plain date stored as UTC midnight (collection dates);
   * sale movements carry a real timestamp, which is compared in local time. */
  function isInRange(dateIso: string, dayOnly = true): boolean {
    const date = dayOnly ? parseIsoDay(dateIso) : parseIsoDate(dateIso);
    if (!date) return false;
    if (periodMode === 'year') return date.getFullYear() === year;
    if (periodMode === 'quarter') {
      return date.getFullYear() === year && Math.floor(date.getMonth() / 3) + 1 === quarter;
    }
    if (periodMode === 'custom') {
      const from = parseIsoDay(customFrom);
      const to = parseIsoDay(customTo);
      if (from && date < from) return false;
      // `to` is midnight of the end day, so a same-day record must still count as inside.
      if (to && date > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
      return true;
    }
    return true;
  }

  // Group records merged with the animals' own records (if shown), filtered, newest first.
  const visibleRecords = [...records, ...(isGroup && showSingles ? singleRecords : [])]
    .filter((r) => isInRange(r.collectionDate))
    .filter((r) => typeFilter == null || r.productionTypeId === typeFilter)
    .filter((r) => animalFilter == null || r.animalId === animalFilter)
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate) || b.id - a.id);

  // Marketplace sales are not tied to an animal, so they drop out under an animal filter.
  const visibleSales =
    animalFilter == null
      ? saleMovements
          .filter((m) => isInRange(m.createdAt, false))
          .filter((m) => typeFilter == null || m.productionTypeId === typeFilter)
      : [];

  // Both kinds interleaved by date, newest first — sales show between the collection batches.
  const visibleRows: Array<
    { kind: 'record'; key: string; date: string; record: AnimalProduction } | { kind: 'sale'; key: string; date: string; movement: ProductionMovement }
  > = [
    ...visibleRecords.map((record) => ({ kind: 'record' as const, key: `r${record.id}`, date: record.collectionDate, record })),
    ...visibleSales.map((movement) => ({ kind: 'sale' as const, key: `s${movement.id}`, date: movement.createdAt, movement })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const hasAnyRecords = records.length > 0 || singleRecords.length > 0 || saleMovements.length > 0;


  // Animals of this group that actually have their own records — the animal filter's options.
  const animalsWithRecords = isGroup
    ? [...new Set(singleRecords.map((r) => r.animalId))]
        .filter((id): id is number => id != null)
        .map((id) => ({ id, code: animalCodeById.get(id) ?? `#${id}` }))
    : [];

  return (
    <>
      <div className="production-toolbar">
        {isGroup && singleRecords.length > 0 && (
          <button
            type="button"
            className={showSingles ? 'kind-chip active' : 'kind-chip'}
            onClick={() =>
              setShowSingles((prev) => {
                // Hiding the individual records makes an animal filter meaningless.
                if (prev) setAnimalFilter(null);
                return !prev;
              })
            }
          >
            <span>{showSingles ? t('production.hideIndividual') : t('production.showIndividual')}</span>
          </button>
        )}
        <button
          type="button"
          className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label={t('report.filtersLabel')}
        >
          <FilterIcon width={18} height={18} />
        </button>
      </div>

      {filtersOpen && (
        <div className="report-filter-panel">
          <div className="filter-row">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={periodMode === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setPeriodMode(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>

          {(periodMode === 'year' || periodMode === 'quarter') && (
            <div className="report-year-row">
              <button type="button" className="report-year-nav-button" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
                ‹
              </button>
              <span className="report-year-text">{year}</span>
              <button type="button" className="report-year-nav-button" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
                ›
              </button>
            </div>
          )}

          {periodMode === 'quarter' && (
            <div className="filter-row">
              {QUARTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={quarter === opt.value ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setQuarter(opt.value)}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          )}

          {periodMode === 'custom' && (
            <div className="report-custom-range-row">
              <div className="field">
                <label>{t('report.fromDate')}</label>
                <DateField value={customFrom} max={todayIsoDate()} onChange={setCustomFrom} />
              </div>
              <div className="field">
                <label>{t('report.toDate')}</label>
                <DateField value={customTo} max={todayIsoDate()} onChange={setCustomTo} />
              </div>
            </div>
          )}

          <div className="report-filter-section-label">{t('report.productTypeFilterLabel')}</div>
          <div className="filter-row">
            <button
              type="button"
              className={typeFilter == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => setTypeFilter(null)}
            >
              <span>{t('report.filterAll')}</span>
            </button>
            {productionTypes.map((pt) => (
              <button
                key={pt.id}
                type="button"
                className={typeFilter === pt.id ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setTypeFilter(pt.id)}
              >
                <span>{typeLabel(pt)}</span>
              </button>
            ))}
          </div>

          {isGroup && showSingles && animalsWithRecords.length > 0 && (
            <>
              <div className="report-filter-section-label">{t('production.animalFilterLabel')}</div>
              <div className="filter-row">
                <button
                  type="button"
                  className={animalFilter == null ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setAnimalFilter(null)}
                >
                  <span>{t('report.filterAll')}</span>
                </button>
                {animalsWithRecords.map((animal) => (
                  <button
                    key={animal.id}
                    type="button"
                    className={animalFilter === animal.id ? 'kind-chip active' : 'kind-chip'}
                    onClick={() => setAnimalFilter(animal.id)}
                  >
                    <span>{animal.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {visibleRows.length === 0 ? (
        <p className="empty-state">{hasAnyRecords ? t('report.noResultsProduction') : t('production.empty')}</p>
      ) : (
        <div className="production-table-wrap">
          <div className={isGroup ? 'production-table group' : 'production-table'}>
            <div className="production-row production-row-head">
              <span>{t('production.type')}</span>
              <span>{t('production.collectionDate')}</span>
              <span className="num">{t('production.quantity')}</span>
              {isGroup && <span className="num">{t('production.animalCount')}</span>}
              <span>{t('production.quality')}</span>
              <span className="num">{t('production.pricePerUnit')}</span>
              <span className="num">{t('production.totalPrice')}</span>
              <span>{t('production.details')}</span>
              <span />
            </div>

            {visibleRows.map((row) => {
              if (row.kind === 'sale') {
                const { movement } = row;
                const unit = unitById.get(movement.unitId);
                return (
                  <div key={row.key} className="production-row sale">
                    <span className="production-row-cell">
                      {typeLabel(typeById.get(movement.productionTypeId))}
                      <span className="production-row-animal"> · {t('market.sold')}</span>
                    </span>
                    <span className="production-row-cell muted">{formatLocalizedIsoDate(movement.createdAt, language)}</span>
                    <span className="production-row-cell num strong sale-delta">
                      {movement.delta} <span className="production-row-unit">{unit?.shortName ?? unitLabel(unit)}</span>
                    </span>
                    {isGroup && <span className="production-row-cell num muted">—</span>}
                    <span className="production-row-cell muted">—</span>
                    <span className="production-row-cell num muted">—</span>
                    <span className="production-row-cell num muted">—</span>
                    <span className="production-row-cell muted">{t('market.title')}</span>
                    <span className="production-row-actions">
                      <button
                        type="button"
                        className="production-row-delete"
                        onClick={() =>
                          setConfirmRollback({
                            id: movement.id,
                            label: `${typeLabel(typeById.get(movement.productionTypeId))} · ${Math.abs(movement.delta)} ${
                              unit?.shortName ?? unitLabel(unit)
                            }`,
                          })
                        }
                        aria-label={t('production.rollbackSale')}
                        title={t('production.rollbackSale')}
                      >
                        ↺
                      </button>
                    </span>
                  </div>
                );
              }

              const { record } = row;
              const unit = unitById.get(record.unitId);
              const dateLabel = formatLocalizedIsoDay(record.collectionDate, language);
              const isSingle = isGroup && record.animalId != null;
              const animalCode = isSingle && record.animalId != null ? animalCodeById.get(record.animalId) : undefined;

              // Collector, batch and notes are low-frequency and long; they share one cell that
              // ellipsises, with the full text on hover, so the numeric columns stay aligned.
              const details = [
                record.collectedBy,
                record.batchNumber ? `${t('production.batchNumber')}: ${record.batchNumber}` : null,
                record.notes,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <div key={row.key} className={isSingle ? 'production-row single' : 'production-row'}>
                  <button
                    type="button"
                    className="production-row-cell type"
                    onClick={() => openEdit(record)}
                    title={t('common.edit')}
                  >
                    {typeLabel(typeById.get(record.productionTypeId))}
                    {animalCode && <span className="production-row-animal"> · {animalCode}</span>}
                  </button>
                  <span className="production-row-cell muted">{dateLabel}</span>
                  <span className="production-row-cell num strong income-delta">
                    +{record.quantity} <span className="production-row-unit">{unit?.shortName ?? unitLabel(unit)}</span>
                  </span>
                  {isGroup && <span className="production-row-cell num">{record.animalCount}</span>}
                  <span className="production-row-cell">{record.quality || '—'}</span>
                  <span className="production-row-cell num">
                    {record.pricePerUnit != null ? formatPrice(record.pricePerUnit) : '—'}
                  </span>
                  <span className="production-row-cell num value">
                    {record.totalPrice != null ? formatPrice(record.totalPrice) : '—'}
                  </span>
                  <span className="production-row-cell muted" title={details || undefined}>
                    {details || '—'}
                  </span>
                  <span className="production-row-actions">
                    <button
                      type="button"
                      className="production-row-edit"
                      onClick={() => openEdit(record)}
                      aria-label={t('production.editRecord')}
                      title={t('production.editRecord')}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="production-row-delete"
                      onClick={() =>
                        setConfirmDelete({
                          id: record.id,
                          label: `${dateLabel} · ${typeLabel(typeById.get(record.productionTypeId))}`,
                        })
                      }
                      aria-label={t('common.delete')}
                      title={t('common.delete')}
                    >
                      ✕
                    </button>
                  </span>
                </div>
              );
            })}

          </div>
        </div>
      )}

      {error && <div className="error-banner">{t('production.loadError')}</div>}

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('production.addRecord')}
      </button>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">{editingRecord ? t('production.editRecord') : t('production.addRecord')}</h2>

            <div className="form-fields modal-form-grid">
              <div className="field field-full">
                <label>{t('production.type')}</label>
                <KindPicker
                  options={productionTypes.map((pt) => ({ value: String(pt.id), label: typeLabel(pt) }))}
                  selected={form.productionTypeId != null ? String(form.productionTypeId) : ''}
                  onSelect={(value) => setField('productionTypeId', Number(value))}
                  onAddNew={handleAddProductionType}
                  addPlaceholder={t('production.typePlaceholder')}
                  onRemove={(value) => {
                    const pt = typeById.get(Number(value));
                    if (pt) setConfirmDeleteType({ id: pt.id, label: typeLabel(pt) });
                  }}
                  removeLabel={t('common.delete')}
                />
                {typeError && <div className="error-banner">{typeError}</div>}
              </div>

              <div className="field">
                <label>{t('production.collectionDate')}</label>
                <DateField
                  value={form.collectionDate}
                  max={todayIsoDate()}
                  clearable={false}
                  onChange={(v) => setField('collectionDate', v ?? '')}
                />
              </div>

              <div className="field">
                <label>{t('production.quantity')}</label>
                <input
                  value={form.quantity}
                  onChange={(e) => setQuantityOrPrice('quantity', e.target.value)}
                  placeholder={t('production.quantityPlaceholder')}
                  inputMode="decimal"
                />
              </div>

              <div className="field field-full">
                <label>{t('production.unit')}</label>
                <div className="kind-row">
                  {units.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={form.unitId === u.id ? 'kind-chip active' : 'kind-chip'}
                      onClick={() => setField('unitId', u.id)}
                    >
                      <span>
                        {unitLabel(u)} ({u.shortName})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* A single-animal record's count is always 1 — hide the field when editing one. */}
              {isGroup && editingRecord?.animalId == null && (
                <div className="field">
                  <label>{t('production.animalCount')}</label>
                  <input
                    value={form.animalCount}
                    onChange={(e) => setField('animalCount', e.target.value)}
                    placeholder={t('production.animalCountPlaceholder')}
                    inputMode="numeric"
                  />
                </div>
              )}

              <div className="field">
                <label>{t('production.quality')}</label>
                <input
                  value={form.quality}
                  onChange={(e) => setField('quality', e.target.value)}
                  placeholder={t('production.qualityPlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('production.pricePerUnit')}</label>
                <input
                  value={form.pricePerUnit}
                  onChange={(e) => setQuantityOrPrice('pricePerUnit', e.target.value)}
                  inputMode="decimal"
                />
              </div>

              <div className="field">
                <label>{t('production.totalPrice')}</label>
                <input
                  value={form.totalPrice}
                  onChange={(e) => setForm((prev) => ({ ...prev, totalPrice: e.target.value, totalPriceEdited: true }))}
                  inputMode="decimal"
                />
              </div>

              <div className="field">
                <label>{t('production.collectedBy')}</label>
                <input value={form.collectedBy} onChange={(e) => setField('collectedBy', e.target.value)} />
              </div>

              <div className="field">
                <label>{t('production.batchNumber')}</label>
                <input value={form.batchNumber} onChange={(e) => setField('batchNumber', e.target.value)} />
              </div>

              <div className="field field-full">
                <label>{t('production.notes')}</label>
                <input
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder={t('production.notesPlaceholder')}
                />
              </div>

              {formError && <div className="error-banner field-full">{formError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn" onClick={handleSubmit} disabled={!canSubmit}>
                {editingRecord ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteRecord}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteType}
        name={confirmDeleteType?.label ?? ''}
        onCancel={() => setConfirmDeleteType(null)}
        onConfirm={confirmDeleteProductionType}
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
