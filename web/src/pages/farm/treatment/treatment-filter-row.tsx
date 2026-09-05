import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { TREE_TREATMENTS, treeTreatmentColour, treeTreatmentLabel } from '@/config/tree-treatment';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  selected: string[];
  counts: Map<string, number>;
  onChange: (types: string[]) => void;
};

export function TreatmentFilterRow({ selected, counts, onChange }: Props) {
  const { t } = useLanguage();

  const options: MultiSelectOption[] = TREE_TREATMENTS.map((type) => {
    const count = counts.get(type) ?? 0;
    return {
      value: type,
      label: treeTreatmentLabel(type, t),
      colour: treeTreatmentColour(type),
      hint: count > 0 ? String(count) : undefined,
    };
  });

  return (
    <div className="trt-filter">
      <MultiSelect
        options={options}
        selected={selected}
        onChange={onChange}
        placeholder={t('treatment.allTypes')}
        searchPlaceholder={t('treatment.typeSearch')}
        emptyText={t('treatment.noTypeMatch')}
        markAllLabel={t('common.markAll')}
      />
    </div>
  );
}
