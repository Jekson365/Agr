import '@/components/farm/kind-picker.css';
import '@/components/farm/search-filter.css';
import { SearchIcon } from '@/components/icons/misc-icons';
import { HARVEST_STATUSES, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { isFiltering, optionsForKind, type TimelineFilters } from './harvest-timeline-filters';
import type { TargetOption } from './harvest-timeline-targets';
import './harvest-timeline-filter-bar.css';

type Props = {
  filters: TimelineFilters;
  options: TargetOption[];
  greenhouseOn: boolean;
  onChange: (next: TimelineFilters) => void;
  onClear: () => void;
};

export function HarvestTimelineFilterBar({ filters, options, greenhouseOn, onChange, onClear }: Props) {
  const { t } = useLanguage();

  const allowed = optionsForKind(options, filters.kind);
  const stockOptions = allowed.filter((option) => option.group === 'stock');
  const treeOptions = allowed.filter((option) => option.group === 'tree');

  function setKind(kind: TimelineFilters['kind']) {
    const next = optionsForKind(options, kind);
    const target = next.some((option) => option.value === filters.target) ? filters.target : 'all';
    onChange({ ...filters, kind, target });
  }

  return (
    <div className="hcal-filters">
      <div className="search-row">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input
            value={filters.query}
            placeholder={t('harvestTimeline.searchPlaceholder')}
            aria-label={t('harvestTimeline.searchPlaceholder')}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
          />
        </label>
      </div>

      <div className="filter-row hcal-filter-row">
        <select
          className="hcal-filter-select"
          value={filters.status}
          aria-label={t('harvestTimeline.allStatuses')}
          onChange={(e) => onChange({ ...filters, status: e.target.value as TimelineFilters['status'] })}
        >
          <option value="all">{t('harvestTimeline.allStatuses')}</option>
          {HARVEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(HARVEST_STATUS_LABEL_KEY[status])}
            </option>
          ))}
        </select>

        <select
          className="hcal-filter-select"
          value={filters.kind}
          aria-label={t('harvestTimeline.allKinds')}
          onChange={(e) => setKind(e.target.value as TimelineFilters['kind'])}
        >
          <option value="all">{t('harvestTimeline.allKinds')}</option>
          <option value="crop">{t('harvestTimeline.kindCrop')}</option>
          <option value="fruit">{t('harvestTimeline.kindFruit')}</option>
          {greenhouseOn && <option value="greenhouse">{t('farm.greenhouse')}</option>}
        </select>

        <select
          className="hcal-filter-select"
          value={filters.target}
          disabled={allowed.length === 0}
          aria-label={t('harvestTimeline.allTargets')}
          onChange={(e) => onChange({ ...filters, target: e.target.value })}
        >
          <option value="all">{t('harvestTimeline.allTargets')}</option>
          {stockOptions.length > 0 && (
            <optgroup label={t('harvestTimeline.groupStock')}>
              {stockOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          )}
          {treeOptions.length > 0 && (
            <optgroup label={t('harvestTimeline.groupTree')}>
              {treeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>

        <label className={filters.hideCompleted ? 'hcal-filter-check active' : 'hcal-filter-check'}>
          <input
            type="checkbox"
            checked={filters.hideCompleted}
            onChange={(e) => onChange({ ...filters, hideCompleted: e.target.checked })}
          />
          {t('harvestTimeline.hideCompleted')}
        </label>

        {isFiltering(filters) && (
          <button type="button" className="kind-chip" onClick={onClear}>
            <span>{t('common.clear')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
