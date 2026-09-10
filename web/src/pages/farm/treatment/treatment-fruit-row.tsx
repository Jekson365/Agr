import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  orchards: TreeStock[];
  selectedIds: number[];
  counts: Map<number, number>;
  onChange: (ids: number[]) => void;
};

export function TreatmentFruitRow({ orchards, selectedIds, counts, onChange }: Props) {
  const { t } = useLanguage();

  const options: MultiSelectOption[] = orchards.map((orchard) => {
    const count = counts.get(orchard.id) ?? 0;
    return {
      value: String(orchard.id),
      label: treeStockLabel(orchard, t),
      icon: fruitKindImage(orchard.type),
      hint: count > 0 ? String(count) : undefined,
    };
  });

  return (
    <div className="trt-field">
      <span className="trt-field-label">{t('treatment.orchards')}</span>
      <MultiSelect
        options={options}
        selected={selectedIds.map(String)}
        onChange={(values) => onChange(values.map(Number))}
        placeholder={t('treatment.noneFruits')}
        allSelectedLabel={t('treatment.allFruits')}
        searchPlaceholder={t('treatment.fruitSearch')}
        emptyText={t('treatment.noFruitMatch')}
        markAllLabel={t('common.markAll')}
      />
    </div>
  );
}
