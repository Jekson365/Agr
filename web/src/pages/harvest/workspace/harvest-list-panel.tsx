import { useState } from 'react';

import harvestIcon from '@/assets/icons/harvest.png';
import '@/components/farm/search-filter.css';
import '@/components/harvest/harvest.css';
import { ChevronLeftIcon, ChevronRightIcon, FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY, harvestStatusesFor } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest, HarvestKind } from '@/types/harvest';
import '../detail/harvest-detail-panels.css';
import { HARVEST_SORT_OPTIONS, type HarvestFilters } from './harvest-list-filter';

type Props = {
  kind: HarvestKind;
  harvests: Harvest[];
  total: number;
  overdueCount: number;
  filters: HarvestFilters;
  onFilters: (next: HarvestFilters) => void;
  selectedId: number | null;
  onSelect: (id: number) => void;
  emptyText: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

export function HarvestListPanel({
  kind,
  harvests,
  total,
  overdueCount,
  filters,
  onFilters,
  selectedId,
  onSelect,
  emptyText,
  collapsed,
  onCollapsedChange,
}: Props) {
  const { t } = useLanguage();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <aside className={collapsed ? 'hw-list collapsed' : 'hw-list'}>
      <div className="hw-list-head">
        <h2 className="hw-list-title">{t('harvest.title')}</h2>
        <button
          type="button"
          className="hw-fold"
          title={t(collapsed ? 'harvest.listExpand' : 'harvest.listCollapse')}
          aria-label={t(collapsed ? 'harvest.listExpand' : 'harvest.listCollapse')}
          aria-expanded={!collapsed}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? <ChevronRightIcon width={18} height={18} /> : <ChevronLeftIcon width={18} height={18} />}
        </button>
      </div>

      <div className="search-row hw-search">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input
            value={filters.search}
            onChange={(e) => onFilters({ ...filters, search: e.target.value })}
            placeholder={t('harvest.searchPlaceholder')}
          />
        </label>
        <button
          type="button"
          className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label={t('harvest.filtersLabel')}
        >
          <FilterIcon width={18} height={18} />
        </button>
      </div>

      {filtersOpen && (
        <>
          <div className="filter-row hw-filter-row">
            <button
              type="button"
              className={filters.status == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onFilters({ ...filters, status: null })}
            >
              <span>{t('harvest.filterAll')}</span>
            </button>
            {harvestStatusesFor(kind).map((status) => (
              <button
                key={status}
                type="button"
                className={filters.status === status ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onFilters({ ...filters, status })}
              >
                <span>{t(HARVEST_STATUS_LABEL_KEY[status])}</span>
              </button>
            ))}
            <button
              type="button"
              className={filters.overdueOnly ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onFilters({ ...filters, overdueOnly: !filters.overdueOnly })}
              disabled={overdueCount === 0 && !filters.overdueOnly}
            >
              <span>
                {t('harvest.filterOverdue')}
                {overdueCount > 0 ? ` (${overdueCount})` : ''}
              </span>
            </button>
          </div>
          <div className="filter-row hw-filter-row">
            {HARVEST_SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={filters.sort === option.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onFilters({ ...filters, sort: option.value })}
              >
                <span>{t(option.labelKey)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {harvests.length === 0 ? (
        <p className="hd-empty">{emptyText}</p>
      ) : (
        <div className="hw-rows">
          {harvests.map((item) => {
            const label = `${item.title} · ${formatIsoDayNumeric(item.date)}`;
            return (
              <button
                key={item.id}
                type="button"
                className={item.id === selectedId ? 'hw-row selected' : 'hw-row'}
                aria-current={item.id === selectedId}
                aria-label={label}
                title={collapsed ? label : undefined}
                onClick={() => onSelect(item.id)}
              >
                <img src={harvestIcon} alt="" className="hw-row-icon" />
                <span className="hw-row-main">
                  <span className="hw-row-title">{item.title}</span>
                  <span className={`${HARVEST_STATUS_BADGE_CLASS[item.status]} harvest-status-badge`}>
                    {t(HARVEST_STATUS_LABEL_KEY[item.status])}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <p className="hw-list-count">
        {harvests.length} / {total}
      </p>
    </aside>
  );
}
