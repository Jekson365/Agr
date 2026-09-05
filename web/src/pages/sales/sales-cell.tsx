import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { formatLocalizedIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import { LISTING_SOURCE_KIND_LABEL_KEY, listingItemLabel } from '@/config/market-listing';
import type { MarketSale } from '@/types/market-sale';
import type { SalesColumnId } from './sales-columns';
import './sales-cell.css';

export type SalesCellContext = {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: DateLanguage;
  formatPrice: (amount: number) => string;
  busyId: number | null;
  onToggle: (sale: MarketSale) => void;
  onDelete: (sale: MarketSale) => void;
};

const NONE = <span className="sales-none">—</span>;

function text(value: string): ReactNode {
  const trimmed = value.trim();
  return trimmed === '' ? NONE : trimmed;
}

export function salesCell(sale: MarketSale, id: SalesColumnId, ctx: SalesCellContext): ReactNode {
  const { t, language, formatPrice, busyId } = ctx;
  const isSold = sale.fulfillment === 'Sold';
  const busy = busyId === sale.id;

  switch (id) {
    case 'date':
      return formatLocalizedIsoDate(sale.createdAt, language);
    case 'buyer':
      return text(`${sale.buyerName} ${sale.buyerSurname}`);
    case 'phone':
      return sale.buyerPhone ? (
        <a className="sales-phone" href={`tel:${sale.buyerPhone}`}>
          {sale.buyerPhone}
        </a>
      ) : (
        NONE
      );
    case 'city':
      return text(sale.buyerCity);
    case 'village':
      return text(sale.buyerVillage);
    case 'address':
      return text(sale.buyerAddress);
    case 'item':
      return itemCell(sale, t);
    case 'amount':
      return formatPrice(sale.amount);
    case 'quantity':
      return (
        <>
          {sale.quantity}
          {sale.priceUnit && <span className="sales-unit">{sale.priceUnit}</span>}
        </>
      );
    case 'status':
      return (
        <div className="sales-status">
          <span className={isSold ? 'sales-badge sold' : 'sales-badge ordered'}>
            {t(isSold ? 'sales.statusSold' : 'sales.statusOrdered')}
          </span>
          <button
            type="button"
            className={sale.isManual ? 'sales-row-action danger' : 'sales-row-action'}
            disabled={busy}
            onClick={() => (sale.isManual ? ctx.onDelete(sale) : ctx.onToggle(sale))}
          >
            {busy
              ? '…'
              : sale.isManual
                ? t('common.delete')
                : t(isSold ? 'sales.markOrdered' : 'sales.markSold')}
          </button>
        </div>
      );
    case 'social':
      return sale.buyerFacebookUrl ? (
        <a className="sales-fb" href={sale.buyerFacebookUrl} target="_blank" rel="noreferrer">
          Facebook
        </a>
      ) : (
        NONE
      );
  }
}

function itemCell(sale: MarketSale, t: SalesCellContext['t']): ReactNode {
  const kindLabel = listingItemLabel(sale.itemCategory, sale.itemType, t);
  const name = sale.itemTitle.trim() || kindLabel || '—';
  const tags: ReactNode[] = [];

  if (sale.isManual) {
    tags.push(
      <span key="manual" className="sales-tag">
        {t('sales.manualBadge')}
      </span>
    );
  }
  if (sale.sourceKind) {
    tags.push(
      <span key="source" className="sales-tag">
        {t(LISTING_SOURCE_KIND_LABEL_KEY[sale.sourceKind])} #{sale.sourceId}
      </span>
    );
  }
  if (sale.stockApplied) {
    tags.push(
      <span key="applied" className="sales-tag applied">
        {t('sales.balanceUpdated')}
      </span>
    );
  }

  return (
    <div className="sales-item">
      {sale.listingId != null ? (
        <Link to={`/market/${sale.listingId}`} className="sales-item-link">
          {name}
        </Link>
      ) : (
        <span className="sales-item-name">{name}</span>
      )}
      {tags.length > 0 && <div className="sales-tags">{tags}</div>}
    </div>
  );
}
