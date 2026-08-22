import { useState } from 'react';

import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseDocument } from '@/types/purchase';
import { PURCHASE_KIND_LABEL_KEY } from './purchase-targets';
import './purchase-table.css';

type Props = {
  documents: PurchaseDocument[];
  onEdit: (document: PurchaseDocument) => void;
  onRemove: (document: PurchaseDocument) => void;
};

export function PurchaseTable({ documents, onEdit, onRemove }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <div className="purchase-table-wrap">
      <table className="purchase-table">
        <thead>
          <tr>
            <th className="purchase-col-toggle" />
            <th className="purchase-col-id">{t('purchase.colNumber')}</th>
            <th>{t('purchase.colDate')}</th>
            <th>{t('purchase.colSeller')}</th>
            <th>{t('purchase.colItems')}</th>
            <th className="purchase-col-num">{t('purchase.colTotal')}</th>
            <th className="purchase-col-action" />
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => {
            const open = expanded.has(document.id);
            return [
              <tr key={document.id} className={open ? 'purchase-row open' : 'purchase-row'}>
                <td className="purchase-col-toggle">
                  <button
                    type="button"
                    className="purchase-row-toggle"
                    aria-expanded={open}
                    aria-label={t(open ? 'nav.collapseSection' : 'nav.expandSection', { name: document.seller })}
                    onClick={() => toggle(document.id)}
                  >
                    <ChevronDownIcon className={open ? 'purchase-caret' : 'purchase-caret collapsed'} />
                  </button>
                </td>
                <td className="purchase-col-id">#{document.id}</td>
                <td>{formatLocalizedIsoDay(document.date, language)}</td>
                <td className="purchase-cell-seller">
                  {document.seller}
                  {document.note && <span className="purchase-cell-note">{document.note}</span>}
                </td>
                <td>{t('purchase.itemCount', { count: document.items.length })}</td>
                <td className="purchase-col-num purchase-cell-total">{formatPrice(document.total)}</td>
                <td className="purchase-col-action">
                  <div className="purchase-row-actions">
                    <button type="button" className="btn btn-secondary purchase-row-remove" onClick={() => onEdit(document)}>
                      {t('common.edit')}
                    </button>
                    <button type="button" className="btn btn-danger purchase-row-remove" onClick={() => onRemove(document)}>
                      {t('purchase.remove')}
                    </button>
                  </div>
                </td>
              </tr>,
              open && (
                <tr key={`${document.id}:items`} className="purchase-items-row">
                  <td />
                  <td colSpan={6}>
                    <table className="purchase-items">
                      <tbody>
                        {document.items.map((item) => (
                          <tr key={item.id}>
                            <td className="purchase-items-kind">{t(PURCHASE_KIND_LABEL_KEY[item.kind])}</td>
                            <td className="purchase-items-name">{item.name}</td>
                            <td className="purchase-col-num">{item.quantity}</td>
                            <td className="purchase-col-num">{formatPrice(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}
