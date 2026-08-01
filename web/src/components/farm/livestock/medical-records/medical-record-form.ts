import { todayIsoDate } from '@/components/ui/date-utils';
import type { MedicalRecordInput } from '@/types/medical-record';

/**
 * The add-record form. Numbers are held as strings so a half-typed value stays exactly as typed,
 * and are parsed only on the way out — see {@link buildMedicalRecordInput}. The two date fields
 * are nullable because the picker can be cleared.
 */
export type MedicalRecordForm = {
  recordType: string;
  visitDate: string | null;
  diagnosis: string;
  symptoms: string;
  treatment: string;
  medication: string;
  dosage: string;
  route: string;
  durationDays: string;
  veterinarianId: string;
  clinicName: string;
  temperature: string;
  weight: string;
  heartRate: string;
  respiratoryRate: string;
  followUpDate: string | null;
  cost: string;
  outcome: string;
  notes: string;
};

export function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

/** A blank form dated today. Built per call rather than held as a constant, so a page left open
 * overnight still opens the form on the current day. */
export function makeEmptyForm(): MedicalRecordForm {
  return {
    recordType: '',
    visitDate: todayIsoDate(),
    diagnosis: '',
    symptoms: '',
    treatment: '',
    medication: '',
    dosage: '',
    route: '',
    durationDays: '',
    veterinarianId: '',
    clinicName: '',
    temperature: '',
    weight: '',
    heartRate: '',
    respiratoryRate: '',
    followUpDate: null,
    cost: '',
    outcome: '',
    notes: '',
  };
}

/** A visit needs what it was and when; everything else on the form is optional detail. */
export function isFormComplete(form: MedicalRecordForm): boolean {
  return form.recordType.trim().length > 0 && !!form.visitDate;
}

/** The record to send. Null while the form is missing what {@link isFormComplete} requires. */
export function buildMedicalRecordInput(form: MedicalRecordForm, stockId: number): MedicalRecordInput | null {
  const recordType = form.recordType.trim();
  if (!recordType || !form.visitDate) {
    return null;
  }

  return {
    stockId,
    visitDate: form.visitDate,
    recordType,
    diagnosis: form.diagnosis.trim() || null,
    symptoms: form.symptoms.trim() || null,
    treatment: form.treatment.trim() || null,
    medication: form.medication.trim() || null,
    dosage: form.dosage.trim() || null,
    route: form.route.trim() || null,
    durationDays: parseIntOrNull(form.durationDays),
    veterinarianId: parseIntOrNull(form.veterinarianId),
    clinicName: form.clinicName.trim() || null,
    temperature: parseFloatOrNull(form.temperature),
    weight: parseFloatOrNull(form.weight),
    heartRate: parseIntOrNull(form.heartRate),
    respiratoryRate: parseIntOrNull(form.respiratoryRate),
    followUpDate: form.followUpDate,
    cost: parseFloatOrNull(form.cost),
    outcome: form.outcome.trim() || null,
    notes: form.notes.trim() || null,
  };
}
