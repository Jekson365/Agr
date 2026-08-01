import type { MedicalRecordForm } from './medical-record-form';

/** The two fields backed by a date picker rather than a text input. */
export type DateKey = 'visitDate' | 'followUpDate';
export type TextKey = Exclude<keyof MedicalRecordForm, DateKey>;

export type FieldSpec =
  | {
      kind: 'text';
      key: TextKey;
      labelKey: string;
      placeholderKey?: string;
      inputMode?: 'numeric' | 'decimal';
      autoFocus?: boolean;
    }
  | {
      kind: 'date';
      key: DateKey;
      labelKey: string;
      /** A visit already happened; a follow-up is by definition still to come. */
      notFuture?: boolean;
    };

/**
 * The add form, in order. Held as data rather than as nineteen near-identical blocks of JSX —
 * translation keys are spelled out in full so they stay greppable.
 */
export const MEDICAL_RECORD_FIELDS: FieldSpec[] = [
  {
    kind: 'text',
    key: 'recordType',
    labelKey: 'medicalRecord.recordType',
    placeholderKey: 'medicalRecord.recordTypePlaceholder',
    autoFocus: true,
  },
  { kind: 'date', key: 'visitDate', labelKey: 'medicalRecord.visitDate', notFuture: true },
  { kind: 'text', key: 'diagnosis', labelKey: 'medicalRecord.diagnosis', placeholderKey: 'medicalRecord.diagnosisPlaceholder' },
  { kind: 'text', key: 'symptoms', labelKey: 'medicalRecord.symptoms', placeholderKey: 'medicalRecord.symptomsPlaceholder' },
  { kind: 'text', key: 'treatment', labelKey: 'medicalRecord.treatment', placeholderKey: 'medicalRecord.treatmentPlaceholder' },
  { kind: 'text', key: 'medication', labelKey: 'medicalRecord.medication', placeholderKey: 'medicalRecord.medicationPlaceholder' },
  { kind: 'text', key: 'dosage', labelKey: 'medicalRecord.dosage', placeholderKey: 'medicalRecord.dosagePlaceholder' },
  { kind: 'text', key: 'route', labelKey: 'medicalRecord.route', placeholderKey: 'medicalRecord.routePlaceholder' },
  { kind: 'text', key: 'durationDays', labelKey: 'medicalRecord.durationDays', inputMode: 'numeric' },
  { kind: 'text', key: 'veterinarianId', labelKey: 'medicalRecord.veterinarianId', inputMode: 'numeric' },
  { kind: 'text', key: 'clinicName', labelKey: 'medicalRecord.clinicName' },
  { kind: 'text', key: 'temperature', labelKey: 'medicalRecord.temperature', inputMode: 'decimal' },
  { kind: 'text', key: 'weight', labelKey: 'medicalRecord.weight', inputMode: 'decimal' },
  { kind: 'text', key: 'heartRate', labelKey: 'medicalRecord.heartRate', inputMode: 'numeric' },
  { kind: 'text', key: 'respiratoryRate', labelKey: 'medicalRecord.respiratoryRate', inputMode: 'numeric' },
  { kind: 'date', key: 'followUpDate', labelKey: 'medicalRecord.followUpDate' },
  { kind: 'text', key: 'cost', labelKey: 'medicalRecord.cost', inputMode: 'decimal' },
  { kind: 'text', key: 'outcome', labelKey: 'medicalRecord.outcome', placeholderKey: 'medicalRecord.outcomePlaceholder' },
  { kind: 'text', key: 'notes', labelKey: 'medicalRecord.notes', placeholderKey: 'medicalRecord.notesPlaceholder' },
];
