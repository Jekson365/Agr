import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import harvestIcon from '@/assets/icons/harvest.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import { HarvestFormModal } from '@/components/harvest/harvest-form-modal';
import '@/components/harvest/harvest.css';
import { CalendarIcon, ChevronRightIcon, FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { daysUntilExpected, isOverdue } from '@/config/harvest-analysis';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvest, getHarvests } from '@/services/harvest-service';
import type { Harvest, HarvestKind, HarvestStatus } from '@/types/harvest';
import './harvest-page.css';

type SortOrder = 'dateDesc' | 'dateAsc' | 'titleAsc' | 'expectedAsc';

const SORT_OPTIONS: { value: SortOrder; labelKey: string }[] = [
  { value: 'dateDesc', labelKey: 'harvest.sortNewest' },
  { value: 'dateAsc', labelKey: 'harvest.sortOldest' },
  { value: 'titleAsc', labelKey: 'harvest.sortTitle' },
  { value: 'expectedAsc', labelKey: 'harvest.sortExpected' },
];

type Props = {
  /** Which harvests this tab covers. Crop is the plant-farming tab; Fruit is the orchard's. */
  kind?: HarvestKind;
};

export function HarvestPage({ kind = 'Crop' }: Props) {
  // Fruit harvests open on the orchard's own, simpler detail page.
  const detailBase = kind === 'Fruit' ? '/farm/fruits/harvest' : '/harvest/detail';
  const { t, language } = useLanguage();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<HarvestStatus | null>(null);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('dateDesc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  // `/harvest` and `/farm/fruits/harvest` render this same component, so switching between them
  // reuses the instance rather than remounting — reload when `kind` flips so the list isn't stale.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setHarvests(await getHarvests(kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingHarvest(null);
    setFormOpen(true);
  }

  function openEdit(item: Harvest) {
    setEditingHarvest(item);
    setFormOpen(true);
  }

  async function confirmDeleteHarvest() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvest(id);
      setHarvests((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(harvest: Harvest, isNew: boolean) {
    setHarvests((prev) => (isNew ? [harvest, ...prev] : prev.map((h) => (h.id === harvest.id ? harvest : h))));
  }

  const overdueCount = harvests.filter((h) => isOverdue(h)).length;

  const visibleHarvests = harvests
    .filter((h) => (statusFilter ? h.status === statusFilter : true))
    .filter((h) => (overdueOnly ? isOverdue(h) : true))
    .filter((h) => {
      const term = search.trim().toLowerCase();
      return term ? h.title.toLowerCase().includes(term) : true;
    })
    .sort((a, b) => {
      if (sortOrder === 'dateAsc') return a.date.localeCompare(b.date);
      if (sortOrder === 'titleAsc') return a.title.localeCompare(b.title);
      if (sortOrder === 'expectedAsc') {
        // Harvests without an expected date sort last rather than jumping to the front.
        if (a.expectedHarvestDate == null) return b.expectedHarvestDate == null ? 0 : 1;
        if (b.expectedHarvestDate == null) return -1;
        return a.expectedHarvestDate.localeCompare(b.expectedHarvestDate);
      }
      return b.date.localeCompare(a.date);
    });

  return (
    <div className="harvest-page">
      <div className="page-header">
        <h1 className="page-title">{t('harvest.title')}</h1>
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('harvest.add')}
        </button>
      </div>

      <div className="search-row">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('harvest.searchPlaceholder')} />
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
          <div className="filter-row">
            <button
              type="button"
              className={statusFilter == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => setStatusFilter(null)}
            >
              <span>{t('harvest.filterAll')}</span>
            </button>
            {HARVEST_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setStatusFilter(status)}
              >
                <span>{t(HARVEST_STATUS_LABEL_KEY[status])}</span>
              </button>
            ))}
            <button
              type="button"
              className={overdueOnly ? 'kind-chip active' : 'kind-chip'}
              onClick={() => setOverdueOnly((prev) => !prev)}
              disabled={overdueCount === 0 && !overdueOnly}
            >
              <span>
                {t('harvest.filterOverdue')}
                {overdueCount > 0 ? ` (${overdueCount})` : ''}
              </span>
            </button>
          </div>
          <div className="filter-row">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={sortOrder === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setSortOrder(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('harvest.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : harvests.length === 0 ? (
        <p className="empty-state">{t('harvest.empty')}</p>
      ) : visibleHarvests.length === 0 ? (
        <p className="empty-state">{t('harvest.noResults')}</p>
      ) : (
        <div className="entity-tile-grid">
          {visibleHarvests.map((item) => {
            const overdue = isOverdue(item);
            const daysLeft = daysUntilExpected(item);

            return (
              <div key={item.id} className="entity-tile">
                <Link to={`${detailBase}/${item.id}`} className="entity-tile-media">
                  <img src={harvestIcon} alt="" className="entity-tile-icon" />
                </Link>

                <div className="entity-tile-menu">
                  <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, title: item.title })} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{item.title}</h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <CalendarIcon width={16} height={16} />
                      <span>{formatLocalizedIsoDate(item.date, language)}</span>
                    </div>

                    <div className="entity-tile-badges">
                      <span className={`${HARVEST_STATUS_BADGE_CLASS[item.status]} harvest-status-badge`}>
                        {t(HARVEST_STATUS_LABEL_KEY[item.status])}
                      </span>
                      {overdue ? (
                        <span className="harvest-overdue-badge">
                          {t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}
                        </span>
                      ) : item.status !== 'Harvested' && daysLeft != null ? (
                        <span className="harvest-due-badge">{t('harvest.dueIn', { days: daysLeft })}</span>
                      ) : null}
                    </div>
                  </div>

                  <span className="entity-tile-divider" />

                  <Link to={`${detailBase}/${item.id}`} className="entity-tile-details">
                    {t('common.details')}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HarvestFormModal
        open={formOpen}
        kind={kind}
        editingHarvest={editingHarvest}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.title ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteHarvest}
      />
    </div>
  );
}
