import { useCallback, useEffect, useRef, useState } from 'react';

import { getMarketSales, getMarketSalesSummary } from '@/services/market-sale-service';
import type { MarketSale, MarketSalesBucket, MarketSalesSummary, SalesPeriod } from '@/types/market-sale';
import { bucketRange } from './sales-labels';

function bucketIndexFor(buckets: MarketSalesBucket[], isoDate: string | null): number | null {
  if (buckets.length === 0) return null;
  if (!isoDate) return buckets.length - 1;
  const match = buckets.findLastIndex((bucket) => bucket.start <= isoDate);
  return match === -1 ? buckets.length - 1 : match;
}

export function useSalesData() {
  const [period, setPeriod] = useState<SalesPeriod>('Month');
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const [summary, setSummary] = useState<MarketSalesSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [sales, setSales] = useState<MarketSale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const focusDate = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setError(null);
    getMarketSalesSummary(period, from, to)
      .then((next) => {
        if (cancelled) return;
        setSummary(next);
        setSelectedIndex(bucketIndexFor(next.buckets, focusDate.current));
        focusDate.current = null;
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period, from, to, refreshKey]);

  const selectedBucket = summary && selectedIndex != null ? summary.buckets[selectedIndex] : undefined;
  const selectedStart = selectedBucket?.start;
  const unit = summary?.unit;

  useEffect(() => {
    if (!selectedStart || !unit) {
      setSales([]);
      setSalesLoading(false);
      return;
    }

    let cancelled = false;
    const range = bucketRange(selectedStart, unit);
    setSalesLoading(true);
    setError(null);
    getMarketSales(range.from, range.to)
      .then((rows) => {
        if (!cancelled) setSales(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setSalesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedStart, unit, refreshKey]);

  const patchSale = useCallback((saved: MarketSale) => {
    setSales((prev) => prev.map((row) => (row.id === saved.id ? saved : row)));
  }, []);

  const reload = useCallback((focusIsoDate?: string | null) => {
    focusDate.current = focusIsoDate ?? null;
    setRefreshKey((key) => key + 1);
  }, []);

  return {
    period,
    setPeriod,
    from,
    setFrom,
    to,
    setTo,
    summary,
    summaryLoading,
    selectedIndex,
    setSelectedIndex,
    selectedBucket,
    sales,
    salesLoading,
    error,
    setError,
    patchSale,
    reload,
  };
}
