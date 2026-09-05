import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { orchardColour } from '@/config/orchard-colours';
import { useLanguage } from '@/contexts/language-context';
import type { OrchardBlock } from '@/types/orchard-block';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  orchards: TreeStock[];
  blocks: OrchardBlock[];
  /** Every orchard drawn on the map right now. */
  selectedIds: number[];
  /** The one the map and the controls are editing. */
  activeId: number | null;
  onToggle: (id: number) => void;
};

/** The orchards there are to position, each reporting how many of its trees already stand
 *  somewhere and carrying the colour it is drawn in. Several can be shown at once; the one in
 *  focus is what the map and the controls beside it are editing. */
export function OrchardList({ orchards, blocks, selectedIds, activeId, onToggle }: Props) {
  const { t } = useLanguage();

  return (
    <aside className="pos-list">
      <h2 className="pos-list-title">{t('positioning.orchards')}</h2>
      <p className="pos-list-hint">{t('positioning.orchardsHint')}</p>

      {orchards.length === 0 ? (
        <p className="pos-empty">{t('positioning.noOrchards')}</p>
      ) : (
        <div className="pos-rows">
          {orchards.map((orchard) => {
            const block = blocks.find((row) => row.treeStockId === orchard.id);
            const placed = block?.treeCount ?? 0;
            const shown = selectedIds.includes(orchard.id);
            const active = orchard.id === activeId;
            const colour = orchardColour(orchard.id);
            return (
              <button
                key={orchard.id}
                type="button"
                className={['pos-row', shown ? 'shown' : '', active ? 'active' : ''].filter(Boolean).join(' ')}
                aria-pressed={shown}
                aria-current={active}
                onClick={() => onToggle(orchard.id)}
              >
                <span
                  className="pos-row-swatch"
                  style={{ background: shown ? colour : 'transparent', borderColor: colour }}
                  aria-hidden="true"
                />
                <img src={fruitKindImage(orchard.type)} alt="" className="pos-row-icon" />
                <span className="pos-row-main">
                  <span className="pos-row-title">{treeStockLabel(orchard, t)}</span>
                  <span className="pos-row-sub">
                    {placed > 0
                      ? t('positioning.placedOf', { placed, total: orchard.amount })
                      : t('positioning.notPlaced', { total: orchard.amount })}
                  </span>
                </span>
                {active && <span className="pos-row-badge">{t('positioning.editing')}</span>}
                {!active && placed > 0 && <span className="pos-row-badge muted">{placed}</span>}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}
