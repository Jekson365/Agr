import harvestIcon from '@/assets/icons/harvest.png';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { AdminHarvest, AdminHarvestYield } from '@/types/admin';
import { formatAmount } from './user-detail-format';
import '@/components/harvest/harvest.css';
import './user-detail-harvests.css';

const UNIT_LABEL_KEY: Record<AdminHarvestYield['source'], Record<string, string>> = {
  stock: STOCK_UNIT_LABEL_KEY,
  tree: TREE_STOCK_UNIT_LABEL_KEY,
  product: TREE_PRODUCT_UNIT_LABEL_KEY,
};

function iconOf(harvest: AdminHarvest): string {
  const first = harvest.yields[0];
  if (first?.source === 'stock') return stockKindImage(first.type);
  if (first?.source === 'tree') return fruitKindImage(first.type);
  return harvestIcon;
}

export function UserDetailHarvests({ harvests }: { harvests: AdminHarvest[] }) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  function yieldLabel(entry: AdminHarvestYield): string {
    const name =
      entry.source === 'stock'
        ? stockTypeLabel(entry.type, t)
        : entry.source === 'tree'
          ? fruitTypeLabel(entry.type, t)
          : entry.name;
    const unitKey = UNIT_LABEL_KEY[entry.source][entry.unit];
    return `${name} ${formatAmount(entry.amount)} ${unitKey ? t(unitKey) : entry.unit}`;
  }

  function metaOf(harvest: AdminHarvest): string {
    const parts = [formatLocalizedIsoDate(harvest.date, language), harvest.farmName];
    if (harvest.expectedHarvestDate) {
      parts.push(`${t('harvest.expectedTag')}: ${formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}`);
    }
    return parts.filter(Boolean).join(' · ');
  }

  return (
    <section className="user-detail-card user-detail-harvests">
      <h2 className="user-detail-title">
        {t('harvest.title')}
        <span className="user-detail-count">{harvests.length}</span>
      </h2>

      {harvests.length === 0 ? (
        <p className="user-detail-empty">{t('managerUser.empty')}</p>
      ) : (
        <ul className="user-detail-harvest-list">
          {harvests.map((harvest) => (
            <li key={harvest.id} className="user-detail-harvest">
              <img className="user-detail-icon" src={iconOf(harvest)} alt="" />
              <div className="user-detail-harvest-main">
                <div className="user-detail-harvest-head">
                  <span className="user-detail-item-title">{harvest.title || t('harvest.title')}</span>
                  <span className={HARVEST_STATUS_BADGE_CLASS[harvest.status]}>
                    {t(HARVEST_STATUS_LABEL_KEY[harvest.status])}
                  </span>
                </div>
                <span className="manager-user-sub">{metaOf(harvest)}</span>
                {harvest.yields.length > 0 && (
                  <div className="user-detail-harvest-yields">
                    {harvest.yields.map((entry, index) => (
                      <span key={`${entry.source}-${index}`} className="user-detail-harvest-yield">
                        {yieldLabel(entry)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="user-detail-harvest-money">
                {harvest.revenue != null && (
                  <span>
                    {t('harvest.revenueLabel')}: {formatPrice(harvest.revenue)}
                  </span>
                )}
                {harvest.cost > 0 && (
                  <span className="manager-user-sub">
                    {t('harvest.expensesTotal')}: {formatPrice(harvest.cost)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
