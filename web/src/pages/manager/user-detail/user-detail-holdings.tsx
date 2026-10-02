import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { AdminUserOverview } from '@/types/admin';
import { formatAmount } from './user-detail-format';
import { UserDetailLands } from './user-detail-lands';
import { UserDetailSection, type DetailItem } from './user-detail-section';

type Props = {
  overview: AdminUserOverview;
};

export function UserDetailHoldings({ overview }: Props) {
  const { t } = useLanguage();

  const stocks: DetailItem[] = overview.stocks.map((stock) => ({
    key: `stock-${stock.id}`,
    image: stockKindImage(stock.type),
    title: stockTypeLabel(stock.type, t),
    subtitle: stock.name,
    value: `${formatAmount(stock.amount)} ${t(STOCK_UNIT_LABEL_KEY[stock.unit] ?? stock.unit)}`,
    removed: stock.isDeleted,
  }));

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

  return (
    <div className="user-detail-holdings">
      <UserDetailLands farms={overview.farms} />
      <div className="user-detail-grid">
        <UserDetailSection title={t('managerUser.stocks')} items={stocks} />
        <UserDetailSection title={t('managerUser.livestock')} items={livestock} />
        <UserDetailSection title={t('managerUser.fruits')} items={fruits} />
      </div>
    </div>
  );
}
