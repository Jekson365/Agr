import { categoriesFor, soilCategoryLabel, soilParameterLabel, SOIL_FORM_OPTIONS } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilNutrientForm, SoilParameterDefinition, SoilReferenceData } from '@/types/soil';
import type { ResultDraft } from './soil-draft';

type Props = {
  parameter: SoilParameterDefinition;
  form: SoilNutrientForm;
  entry: ResultDraft;
  reference: SoilReferenceData;
  onPatch: (patch: Partial<ResultDraft>) => void;
};

export function SoilParameterRow({ parameter, form, entry, reference, onPatch }: Props) {
  const { t } = useLanguage();

  const formLabel = SOIL_FORM_OPTIONS.find((option) => option.value === form);
  const name = soilParameterLabel(parameter.key, t);
  const label = formLabel ? `${name} · ${t(formLabel.labelKey)}` : name;
  const categories = categoriesFor(reference, parameter.id);

  return (
    <div className="field soil-row">
      <label className="soil-row-label">
        {label}
        {!parameter.isRegulationParameter && <span className="soil-ext">{t('soil.extension')}</span>}
      </label>

      {parameter.valueKind === 'Category' ? (
        categories.length === 0 ? (
          <span className="soil-row-hint">{t('soil.noCategories')}</span>
        ) : (
          <select
            value={entry.categoryId}
            onChange={(e) => onPatch({ categoryId: e.target.value })}
            aria-label={label}
          >
            <option value="">—</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {soilCategoryLabel(category.key, t)}
              </option>
            ))}
          </select>
        )
      ) : parameter.valueKind === 'Text' ? (
        <input value={entry.text} onChange={(e) => onPatch({ text: e.target.value })} aria-label={label} />
      ) : (
        <span className="soil-value-field">
          <input
            value={entry.value}
            onChange={(e) => onPatch({ value: e.target.value })}
            inputMode="decimal"
            placeholder="—"
            aria-label={label}
          />
          {entry.unit && <span className="soil-unit">{entry.unit}</span>}
        </span>
      )}
    </div>
  );
}
