import { CardMenu } from '@/components/farm/card-menu';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestTree } from '@/types/harvest-tree';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';
import { harvestedUnitFor, treeInfoFor } from './fruit-harvest-lookups';

type Props = {
  trees: HarvestTree[];
  /** The farm's fruits and their produce, for resolving each row's label and units. */
  treeStocks: TreeStock[];
  products: TreeProduct[];
  onEdit: (tree: HarvestTree) => void;
  /** Given the resolved label too, so the delete prompt can name what it is about to remove. */
  onDelete: (tree: HarvestTree, label: string) => void;
  onAdd: () => void;
};

/**
 * The trees in this harvest: how many of each were picked, and — once the harvest is marked
 * harvested — how much produce each of them actually yielded.
 */
export function HarvestTreeList({ trees, treeStocks, products, onEdit, onDelete, onAdd }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="field harvest-section-label">
        <label>{t('harvestTree.title')}</label>
      </div>

      {trees.length === 0 ? (
        <p className="empty-state">{t('harvestTree.empty')}</p>
      ) : (
        <div className="list-card-grid">
          {trees.map((tree) => {
            const info = treeInfoFor(treeStocks, tree.treeStockId, t);
            return (
              <div key={tree.id} className="list-card">
                <div className="list-card-body">
                  <span className="list-card-icon-wrap">{info && <img src={info.icon} alt="" />}</span>
                  <span className="list-card-info">
                    <span className="list-card-title">{info?.label ?? ''}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {t('harvestTree.amountPicked')}: {tree.amount} {info?.unitLabel ?? ''}
                      {info?.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
                    </span>
                    {tree.harvestedAmount > 0 && (
                      <>
                        <br />
                        <span className="list-card-subtitle">
                          {t('harvestTree.amountHarvested')}: {tree.harvestedAmount}{' '}
                          {harvestedUnitFor(treeStocks, products, tree.treeStockId, t)}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <CardMenu onEdit={() => onEdit(tree)} onDelete={() => onDelete(tree, info?.label ?? '')} />
              </div>
            );
          })}
        </div>
      )}

      <button type="button" className="add-button" onClick={onAdd}>
        + {t('harvestTree.add')}
      </button>
    </>
  );
}
