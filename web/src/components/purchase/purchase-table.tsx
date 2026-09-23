import { useState } from 'react';

import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseDocument } from '@/types/purchase';
import { PurchaseDocRow } from './purchase-doc-row';
import './purchase-table.css';
import './purchase-cells.css';
import './purchase-cards.css';

type Props = {
  documents: PurchaseDocument[];
  onEdit: (document: PurchaseDocument) => void;
  onRemove: (document: PurchaseDocument) => void;
};

export function PurchaseTable({ documents, onEdit, onRemove }: Props) {
  const { t } = useLanguage();

  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const allOpen = documents.length > 0 && documents.every((document) => expanded.has(document.id));
  const allLabel = t(allOpen ? 'purchase.collapseAll' : 'purchase.expandAll');

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setExpanded(allOpen ? new Set() : new Set(documents.map((document) => document.id)));
  }

  return (
    <div className="purchase-grid">
      <div className="purchase-table-wrap">
        <table className="purchase-table">
          <thead>
            <tr>
              <th className="purchase-col-toggle">
                <button
                  type="button"
                  className="purchase-row-toggle"
                  aria-label={allLabel}
                  title={allLabel}
                  onClick={toggleAll}
                >
                  <ChevronDownIcon className={allOpen ? 'purchase-caret' : 'purchase-caret collapsed'} />
                </button>
              </th>
              <th className="purchase-col-id">{t('purchase.colNumber')}</th>
              <th className="purchase-col-date">{t('purchase.colDate')}</th>
              <th className="purchase-col-seller">{t('purchase.colSeller')}</th>
              <th className="purchase-col-goods">{t('purchase.colItems')}</th>
              <th className="purchase-col-total">{t('purchase.colTotal')}</th>
              <th className="purchase-col-action" />
            </tr>
          </thead>
          <tbody>
            {documents.map((document, index) => (
              <PurchaseDocRow
                key={document.id}
                document={document}
                alternate={index % 2 === 1}
                open={expanded.has(document.id)}
                onToggle={() => toggle(document.id)}
                onEdit={() => onEdit(document)}
                onRemove={() => onRemove(document)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
