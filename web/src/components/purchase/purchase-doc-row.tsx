import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { PencilIcon, TrashIcon } from '@/components/icons/tool-icons';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseDocument } from '@/types/purchase';
import { PurchaseGoodsPanel, PurchaseGoodsStack } from './purchase-goods';

type Props = {
  document: PurchaseDocument;
  alternate: boolean;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRemove: () => void;
};

export function PurchaseDocRow({ document, alternate, open, onToggle, onEdit, onRemove }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const classes = ['purchase-row'];
  if (alternate) classes.push('alt');
  if (open) classes.push('open');

  return (
    <>
      <tr className={classes.join(' ')} onClick={onToggle}>
        <td className="purchase-col-toggle">
          <button
            type="button"
            className="purchase-row-toggle"
            aria-expanded={open}
            aria-label={t(open ? 'nav.collapseSection' : 'nav.expandSection', { name: document.seller })}
            onClick={(event) => { event.stopPropagation(); onToggle(); }}
          >
            <ChevronDownIcon className={open ? 'purchase-caret' : 'purchase-caret collapsed'} />
          </button>
        </td>

        <td className="purchase-col-id">
          <span className="purchase-badge-id">#{document.id}</span>
        </td>

        <td className="purchase-col-date">
          <span className="purchase-cell-day">{formatLocalizedIsoDay(document.date, language, { year: false })}</span>
          <span className="purchase-cell-year">{document.date.slice(0, 4)}</span>
        </td>

        <td className="purchase-col-seller">
          <span className="purchase-cell-seller">{document.seller}</span>
          {document.note && <span className="purchase-cell-note">{document.note}</span>}
        </td>

        <td className="purchase-col-goods">
          <span className="purchase-cell-goods">
            <PurchaseGoodsStack items={document.items} />
            <span className="purchase-cell-count">{t('purchase.itemCount', { count: document.items.length })}</span>
          </span>
        </td>

        <td className="purchase-col-total">{formatPrice(document.total)}</td>

        <td className="purchase-col-action">
          <span className="purchase-row-actions" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="purchase-row-action"
              title={t('common.edit')}
              aria-label={t('common.edit')}
              onClick={onEdit}
            >
              <PencilIcon width={16} height={16} />
            </button>
            <button
              type="button"
              className="purchase-row-action danger"
              title={t('purchase.remove')}
              aria-label={t('purchase.remove')}
              onClick={onRemove}
            >
              <TrashIcon width={16} height={16} />
            </button>
          </span>
        </td>
      </tr>

      {open && (
        <tr className="purchase-items-row">
          <td className="purchase-col-toggle" />
          <td colSpan={6}>
            <PurchaseGoodsPanel items={document.items} total={document.total} />
          </td>
        </tr>
      )}
    </>
  );
}
