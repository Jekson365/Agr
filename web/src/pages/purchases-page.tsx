import { useEffect, useMemo, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import { FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { PurchaseFilterPanel } from '@/components/purchase/purchase-filter-panel';
import { EMPTY_FILTERS, filterPurchases, hasActiveFilters, kindsPresent } from '@/components/purchase/purchase-filters';
import { PurchaseModal } from '@/components/purchase/purchase-modal';
import { PurchaseTable } from '@/components/purchase/purchase-table';
import '@/components/purchase/purchase-table.css';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { deletePurchase, getPurchases } from '@/services/purchase-service';
import type { PurchaseDocument } from '@/types/purchase';

export function PurchasesPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [documents, setDocuments] = useState<PurchaseDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  /** The document being rewritten, or null while a new one is being entered. */
  const [editing, setEditing] = useState<PurchaseDocument | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [confirmDelete, setConfirmDelete] = useState<PurchaseDocument | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setDocuments(await getPurchases());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function confirmRemove() {
    if (!confirmDelete) return;
    setError(null);
    try {
      await deletePurchase(confirmDelete.id);
      setDocuments((prev) => prev.filter((document) => document.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch {
      setConfirmDelete(null);
      setError(t('purchase.deleteError'));
    }
  }

  const kinds = useMemo(() => kindsPresent(documents), [documents]);
  const shown = useMemo(() => filterPurchases(documents, filters), [documents, filters]);
  const total = shown.reduce((sum, document) => sum + document.total, 0);
  const narrowed = filters.search.trim() !== '' || hasActiveFilters(filters);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t('purchase.listTitle')}</h1>
        <div className="balance-header-actions">
          <button
            type="button"
            className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label={t('report.filtersLabel')}
          >
            <FilterIcon width={18} height={18} />
          </button>
          <button type="button" className="add-button" onClick={() => { setEditing(null); setFormOpen(true); }}>
            + {t('purchase.title')}
          </button>
        </div>
      </div>

      <div className="search-row">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder={t('purchase.searchPlaceholder')}
          />
        </label>
      </div>

      {filtersOpen && <PurchaseFilterPanel filters={filters} kinds={kinds} onChange={setFilters} />}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : shown.length === 0 ? (
        <p className="empty-state">{t(narrowed ? 'purchase.listNoMatches' : 'purchase.listEmpty')}</p>
      ) : (
        <>
          <div className="purchase-summary">
            <span>{t('purchase.documentCount', { count: shown.length })}</span>
            <span className="purchase-summary-total">
              {t('purchase.total')}: {formatPrice(total)}
            </span>
          </div>

          <PurchaseTable
            documents={shown}
            onEdit={(document) => { setEditing(document); setFormOpen(true); }}
            onRemove={setConfirmDelete}
          />
        </>
      )}

      <PurchaseModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, isNew) =>
          setDocuments((prev) => (isNew ? [saved, ...prev] : prev.map((d) => (d.id === saved.id ? saved : d))))
        }
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete ? `${confirmDelete.seller} (#${confirmDelete.id})` : ''}
        body={t('purchase.deleteBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
