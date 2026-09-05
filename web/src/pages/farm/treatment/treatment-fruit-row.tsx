import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  orchards: TreeStock[];
  selectedId: number | null;
  counts: Map<number, number>;
  onSelect: (id: number | null) => void;
};

export function TreatmentFruitRow({ orchards, selectedId, counts, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <div className="trt-picker">
      <button
        type="button"
        className={selectedId == null ? 'trt-pick all active' : 'trt-pick all'}
        aria-pressed={selectedId == null}
        onClick={() => onSelect(null)}
      >
        <span className="trt-pick-name">{t('treatment.allFruits')}</span>
      </button>

      {orchards.map((orchard) => {
        const count = counts.get(orchard.id) ?? 0;
        const active = orchard.id === selectedId;
        return (
          <button
            key={orchard.id}
            type="button"
            className={active ? 'trt-pick active' : 'trt-pick'}
            aria-pressed={active}
            onClick={() => onSelect(active ? null : orchard.id)}
          >
            <img src={fruitKindImage(orchard.type)} alt="" className="trt-pick-icon" />
            <span className="trt-pick-name">{treeStockLabel(orchard, t)}</span>
            {count > 0 && <span className="trt-pick-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
