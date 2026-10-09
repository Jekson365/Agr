import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { AdminUserOverview } from '@/types/admin';
import { formatAmount } from './user-detail-format';
import { UserDetailHarvests } from './user-detail-harvests';
import { equipmentItems, seedItems, stockItems, wineBatchItems } from './user-detail-item-builders';
import { UserDetailLands } from './user-detail-lands';
import { UserDetailRecords } from './user-detail-records';
import { UserDetailSection, type DetailItem } from './user-detail-section';

type Props = {
  overview: AdminUserOverview;
};

export function UserDetailHoldings({ overview }: Props) {
  const { t } = useLanguage();

  const livestock: DetailItem[] = overview.livestock.map((herd) => ({
    key: `herd-${herd.id}`,
    image: livestockImage(herd.type),
    title: livestockTypeLabel(herd.type, t),
    subtitle: [herd.name, herd.farmName].filter(Boolean).join(' · '),
    value: t('managerUser.heads', { count: herd.count }),
    removed: herd.isDeleted,
  }));

  const fruits: DetailItem[] = overview.treeStocks.map((tree) => ({
    key: `tree-${tree.id}`,
    image: fruitKindImage(tree.type),
    title: fruitTypeLabel(tree.type, t),
    subtitle: [tree.name, tree.farmName].filter(Boolean).join(' · '),
    value: `${formatAmount(tree.amount)} ${t(TREE_STOCK_UNIT_LABEL_KEY[tree.unit] ?? tree.unit)}`,
    removed: tree.isDeleted,
  }));

  const crops = overview.stocks.filter((stock) => stock.category !== 'Wine');
  const vines = overview.stocks.filter((stock) => stock.category === 'Wine');

  return (
    <div className="user-detail-holdings">
      <UserDetailLands farms={overview.farms} />
      <div className="user-detail-grid">
        <UserDetailSection title={t('managerUser.stocks')} items={stockItems(crops, t)} />
        <UserDetailSection title={t('managerUser.livestock')} items={livestock} />
        <UserDetailSection title={t('managerUser.fruits')} items={fruits} />
        <UserDetailSection title={t('wine.stockTitle')} items={stockItems(vines, t)} />
        <UserDetailSection title={t('wine.cellarTitle')} items={wineBatchItems(overview.wineBatches, t)} />
        <UserDetailSection title={t('seed.title')} items={seedItems(overview.seeds, t)} />
        <UserDetailSection title={t('equipment.title')} items={equipmentItems(overview.equipment, t)} />
        <UserDetailRecords records={overview.records} />
      </div>
      <UserDetailHarvests harvests={overview.harvests} />
    </div>
  );
}
