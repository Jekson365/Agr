import { todayIsoDate } from '@/components/ui/date-utils';
import type { AnimalProduction, AnimalProductionInput } from '@/types/animal-production';

/**
 * The add/edit form. Numbers are held as strings so a half-typed value stays exactly as typed,
 * and are parsed only on the way out — see {@link buildProductionInput}.
 */
export type ProductionForm = {
  productionTypeId: number | null;
  collectionDate: string;
  quantity: string;
  unitId: number | null;
  animalCount: string;
  quality: string;
  pricePerUnit: string;
  totalPrice: string;
  /** Set once the total is typed by hand, which stops it tracking quantity × unit price. */
  totalPriceEdited: boolean;
  collectedBy: string;
  batchNumber: string;
  notes: string;
  /** Set by the realization button, never by a field — it decides whether saving this record
   *  also takes its animals off the group, so it is not something the form offers to toggle. */
  isRealization: boolean;
};

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

export function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

export function makeEmptyForm(animalCount: number): ProductionForm {
  return {
    productionTypeId: null,
    collectionDate: todayIsoDate(),
    quantity: '',
    unitId: null,
    animalCount: String(animalCount),
    quality: '',
    pricePerUnit: '',
    totalPrice: '',
    totalPriceEdited: false,
    collectedBy: '',
    batchNumber: '',
    notes: '',
    isRealization: false,
  };
}

export function formFromRecord(record: AnimalProduction): ProductionForm {
  return {
    productionTypeId: record.productionTypeId,
    collectionDate: toDateInputValue(record.collectionDate),
    quantity: String(record.quantity),
    unitId: record.unitId,
    animalCount: String(record.animalCount),
    quality: record.quality ?? '',
    pricePerUnit: record.pricePerUnit != null ? String(record.pricePerUnit) : '',
    totalPrice: record.totalPrice != null ? String(record.totalPrice) : '',
    // Treat the stored total as hand-entered only when it isn't just quantity × unit price.
    // Otherwise editing the quantity would keep the old total, and every value and share in the
    // reports would go on using a figure that no longer matches the record.
    totalPriceEdited:
      record.totalPrice != null &&
      (record.pricePerUnit == null || Math.abs(record.totalPrice - record.quantity * record.pricePerUnit) > 0.005),
    collectedBy: record.collectedBy ?? '',
    batchNumber: record.batchNumber ?? '',
    notes: record.notes ?? '',
    isRealization: record.isRealization,
  };
}

/** Quantity and unit price drive the total, until the total is typed by hand. */
export function withDerivedTotal(form: ProductionForm, key: 'quantity' | 'pricePerUnit', value: string): ProductionForm {
  const next = { ...form, [key]: value };
  if (form.totalPriceEdited) {
    return next;
  }

  const quantity = parseFloat(next.quantity);
  const pricePerUnit = parseFloat(next.pricePerUnit);
  // Clearing either side clears the total too — leaving the last computed figure behind would
  // save a total that no longer matches the quantity or price it came from.
  next.totalPrice = quantity > 0 && pricePerUnit > 0 ? String(Math.round(quantity * pricePerUnit * 100) / 100) : '';
  return next;
}

/** Whether the form holds enough to save. Whether a save is already in flight is the caller's. */
export function isFormComplete(form: ProductionForm, isGroup: boolean): boolean {
  return (
    form.productionTypeId != null &&
    form.unitId != null &&
    !!form.collectionDate &&
    parseFloat(form.quantity) > 0 &&
    (!isGroup || parseInt(form.animalCount, 10) > 0)
  );
}

/**
 * The record to send. Null when the form is missing a type or a unit, which
 * {@link isFormComplete} already refuses to submit.
 */
export function buildProductionInput(
  form: ProductionForm,
  context: { editingRecord: AnimalProduction | null; isGroup: boolean; ownerId: number }
): AnimalProductionInput | null {
  if (form.productionTypeId == null || form.unitId == null) {
    return null;
  }

  const { editingRecord, isGroup, ownerId } = context;
  // An edited record keeps its own owner — a single-animal record opened from the group view must
  // not be silently converted into a group-level one.
  const isSingleEdit = editingRecord?.animalId != null;

  return {
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
    // An edited record keeps what it was saved as: the server refuses to turn a realization into
    // an ordinary record either way, since flipping it would strand the animals it removed.
    isRealization: editingRecord ? editingRecord.isRealization : form.isRealization,
  };
}
