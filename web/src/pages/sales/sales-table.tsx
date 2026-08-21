import { Link } from 'react-router-dom';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { LISTING_SOURCE_KIND_LABEL_KEY, listingItemLabel } from '@/config/market-listing';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { MarketSale } from '@/types/market-sale';

type Props = {
  sales: MarketSale[];
  busyId: number | null;
  onToggle: (sale: MarketSale) => void;
  onDelete: (sale: MarketSale) => void;
};

export function SalesTable({ sales, busyId, onToggle, onDelete }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="sales-table-wrap">
      <table className="sales-table">
        <thead>
          <tr>
            <th>{t('sales.colDate')}</th>
            <th>{t('sales.colBuyer')}</th>
            <th>{t('sales.colPhone')}</th>
            <th>{t('sales.colCity')}</th>
            <th>{t('sales.colVillage')}</th>
            <th>{t('sales.colAddress')}</th>
            <th>{t('sales.colItem')}</th>
            <th className="numeric">{t('sales.colAmount')}</th>
            <th className="numeric">{t('sales.colQuantity')}</th>
            <th>{t('sales.colStatus')}</th>
            <th>{t('sales.colSocial')}</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => {
            const kindLabel = listingItemLabel(sale.itemCategory, sale.itemType, t);
            const itemName = sale.itemTitle.trim() || kindLabel || '—';
            const isSold = sale.fulfillment === 'Sold';

            return (
              <tr key={sale.id}>
                <td className="sales-nowrap">{formatLocalizedIsoDate(sale.createdAt, language)}</td>
                <td className="sales-buyer-name">{`${sale.buyerName} ${sale.buyerSurname}`.trim() || '—'}</td>
                <td className="sales-nowrap">
                  {sale.buyerPhone ? (
                    <a className="sales-phone" href={`tel:${sale.buyerPhone}`}>
                      {sale.buyerPhone}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{sale.buyerCity || '—'}</td>
                <td>{sale.buyerVillage || '—'}</td>
                <td>{sale.buyerAddress || '—'}</td>
                <td>
                  {sale.listingId != null ? (
                    <Link to={`/market/${sale.listingId}`} className="sales-item-link">
                      {itemName}
                    </Link>
                  ) : (
                    itemName
                  )}
                  {sale.isManual && <div className="sales-sub">{t('sales.manualBadge')}</div>}
                  {sale.sourceKind && (
                    <div className="sales-sub">
                      {t(LISTING_SOURCE_KIND_LABEL_KEY[sale.sourceKind])} #{sale.sourceId}
                    </div>
                  )}
                  {sale.stockApplied && <div className="sales-sub">{t('sales.balanceUpdated')}</div>}
                </td>
                <td className="numeric sales-amount">{formatPrice(sale.amount)}</td>
                <td className="numeric sales-nowrap">
                  {sale.quantity} {sale.priceUnit}
                </td>
                <td>
                  <span className={isSold ? 'sales-badge sold' : 'sales-badge ordered'}>
                    {t(isSold ? 'sales.statusSold' : 'sales.statusOrdered')}
                  </span>
                  <button
                    type="button"
                    className="sales-toggle"
                    disabled={busyId === sale.id}
                    onClick={() => (sale.isManual ? onDelete(sale) : onToggle(sale))}
                  >
                    {busyId === sale.id
                      ? '…'
                      : sale.isManual
                        ? t('common.delete')
                        : t(isSold ? 'sales.markOrdered' : 'sales.markSold')}
                  </button>
                </td>
                <td>
                  {sale.buyerFacebookUrl ? (
                    <a className="sales-fb" href={sale.buyerFacebookUrl} target="_blank" rel="noreferrer">
                      Facebook
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
