import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { AnimalProduction } from '@/types/animal-production';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import { productionTypeLabel, productionUnitLabel } from './production-labels';
import { isFormComplete, withDerivedTotal, type ProductionForm } from './production-form';

type Props = {
  open: boolean;
  isGroup: boolean;
  /** Null when adding; the record being changed when editing. */
  editingRecord: AnimalProduction | null;
  form: ProductionForm;
  onFormChange: (form: ProductionForm) => void;
  productionTypes: ProductionType[];
  units: Unit[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: () => void;
};

/** The add/edit record form. Fully controlled — the view owns the form state, since a save has to
 * fold the result back into the list it came from. */
export function ProductionFormModal({
  open,
  isGroup,
  editingRecord,
  form,
  onFormChange,
  productionTypes,
  units,
  saving,
  error,
  onClose,
  onSubmit,
}: Props) {
  const { t } = useLanguage();

  if (!open) return null;

  const setField = <K extends keyof ProductionForm>(key: K, value: ProductionForm[K]) => {
    onFormChange({ ...form, [key]: value });
  };

  const canSubmit = isFormComplete(form, isGroup) && !saving;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">{editingRecord ? t('production.editRecord') : t('production.addRecord')}</h2>

        <div className="form-fields modal-form-grid">
          {/* What the batch is collected under comes from the group — declared once, on the group
              itself — so it is shown back here rather than chosen again per record. */}
          <div className="field field-full">
            <label>{t('production.type')}</label>
            <span className="limit-hint field-fixed-value">
              {productionTypeLabel(
                productionTypes.find((productionType) => productionType.id === form.productionTypeId),
                t
              ) || '—'}
            </span>
          </div>

          <div className="field">
            <label>{t('production.collectionDate')}</label>
            <DateField
              value={form.collectionDate}
              max={todayIsoDate()}
              clearable={false}
              onChange={(value) => setField('collectionDate', value ?? '')}
            />
          </div>

          <div className="field">
            <label>{t('production.quantity')}</label>
            <input
              value={form.quantity}
              onChange={(e) => onFormChange(withDerivedTotal(form, 'quantity', e.target.value))}
              placeholder={t('production.quantityPlaceholder')}
              inputMode="decimal"
            />
          </div>

          <div className="field field-full">
            <label>{t('production.unit')}</label>
            <div className="kind-row">
              {units.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  className={form.unitId === unit.id ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setField('unitId', unit.id)}
                >
                  <span>
                    {productionUnitLabel(unit, t)} ({unit.shortName})
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
              onChange={(e) => onFormChange(withDerivedTotal(form, 'pricePerUnit', e.target.value))}
              inputMode="decimal"
            />
          </div>

          <div className="field">
            <label>{t('production.totalPrice')}</label>
            <input
              value={form.totalPrice}
              onChange={(e) => onFormChange({ ...form, totalPrice: e.target.value, totalPriceEdited: true })}
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

          {error && <div className="error-banner field-full">{error}</div>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" onClick={onSubmit} disabled={!canSubmit}>
            {editingRecord ? t('common.save') : t('common.add')}
          </button>
        </div>
      </div>
    </div>
  );
}
