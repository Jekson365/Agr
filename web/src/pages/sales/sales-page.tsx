import { useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/tabs.css';
import { ManualSaleModal } from '@/components/market/manual-sale-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { deleteManualSale, setMarketSaleFulfillment } from '@/services/market-sale-service';
import type { MarketOrderFulfillment, MarketSale } from '@/types/market-sale';
import { SalesChart } from './sales-chart';
import { bucketTooltip } from './sales-labels';
import { SalesTable } from './sales-table';
import { useSalesData } from './use-sales-data';
import './sales-page.css';

type Filter = 'all' | MarketOrderFulfillment;

export function SalesPage() {
  const { t, language } = useLanguage();
  const data = useSalesData();

  const [filter, setFilter] = useState<Filter>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<MarketSale | null>(null);

  async function toggle(sale: MarketSale) {
    const next: MarketOrderFulfillment = sale.fulfillment === 'Sold' ? 'Ordered' : 'Sold';
    setBusyId(sale.id);
    data.setError(null);
    try {
      data.patchSale(await setMarketSaleFulfillment(sale.id, next));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        data.setError(t('sales.notEnoughStock'));
      } else {
        data.setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const target = deleting;
    if (!target) return;
    setDeleting(null);
    setBusyId(target.id);
    data.setError(null);
    try {
      await deleteManualSale(target.id);
      data.reload(target.createdAt.slice(0, 10));
    } catch (err) {
      data.setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  const orderedCount = data.sales.filter((s) => s.fulfillment === 'Ordered').length;
  const soldCount = data.sales.length - orderedCount;
  const visible = filter === 'all' ? data.sales : data.sales.filter((s) => s.fulfillment === filter);

  const selectedLabel =
    data.selectedBucket && data.summary
      ? bucketTooltip(data.selectedBucket.start, data.summary.unit, language)
      : '';

  return (
    <div>
      <Link to="/main" className="back-link">
        ← {t('sales.back')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('sales.title')}</h1>
        <button type="button" className="add-button" onClick={() => setAddOpen(true)}>
          + {t('sales.manualAdd')}
        </button>
      </div>

      {data.error && <div className="error-banner">{data.error}</div>}

      <SalesChart
        summary={data.summary}
        loading={data.summaryLoading}
        period={data.period}
        onPeriodChange={data.setPeriod}
        from={data.from}
        to={data.to}
        onFromChange={data.setFrom}
        onToChange={data.setTo}
        selectedIndex={data.selectedIndex}
        onSelect={data.setSelectedIndex}
      />

      {selectedLabel && <h2 className="sales-selected-title">{selectedLabel}</h2>}

      <div className="tab-row">
        <button
          type="button"
          className={filter === 'all' ? 'tab-item active' : 'tab-item'}
          onClick={() => setFilter('all')}
        >
          {t('sales.filterAll')} ({data.sales.length})
        </button>
        <button
          type="button"
          className={filter === 'Ordered' ? 'tab-item active' : 'tab-item'}
          onClick={() => setFilter('Ordered')}
        >
          {t('sales.statusOrdered')} ({orderedCount})
        </button>
        <button
          type="button"
          className={filter === 'Sold' ? 'tab-item active' : 'tab-item'}
          onClick={() => setFilter('Sold')}
        >
          {t('sales.statusSold')} ({soldCount})
        </button>
      </div>

      {data.salesLoading ? (
        <div className="state-box">…</div>
      ) : visible.length === 0 ? (
        <p className="empty-state">{t('sales.empty')}</p>
      ) : (
        <SalesTable sales={visible} busyId={busyId} onToggle={toggle} onDelete={setDeleting} />
      )}

      <ManualSaleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={(sale) => data.reload(sale.createdAt.slice(0, 10))}
      />

      <ConfirmModal
        open={deleting != null}
        title={t('sales.manualDeleteTitle')}
        body={t('sales.manualDeleteBody')}
        confirmLabel={t('common.delete')}
        destructive
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
