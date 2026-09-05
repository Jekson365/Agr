import { useEffect, useMemo, useRef, useState } from 'react';

import '@/components/farm/farm-crud.css';
import { HarvestFormModal } from '@/components/harvest/harvest-form-modal';
import { formatLocalizedDate, toIsoDate } from '@/components/ui/date-utils';
import { useForecast } from '@/components/weather/use-forecast';
import { WeatherStrip } from '@/components/weather/weather-strip';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import { GREENHOUSE_CONFIG } from '@/types/configuration';
import type { HarvestKind } from '@/types/harvest';
import { HarvestTimelineCard } from './harvest-timeline-card';
import { HarvestTimelineDayMenu } from './harvest-timeline-day-menu';
import { HarvestTimelineFilterBar } from './harvest-timeline-filter-bar';
import {
  applyFilters,
  EMPTY_FILTERS,
  isFiltering,
  optionsForKind,
  readStoredFilters,
  writeStoredFilters,
  type TimelineFilters,
} from './harvest-timeline-filters';
import { HarvestTimelineGrid } from './harvest-timeline-grid';
import { HarvestTimelineKindModal } from './harvest-timeline-kind-modal';
import type { TimelineHarvest } from './harvest-timeline-spans';
import { HarvestTimelineToolbar } from './harvest-timeline-toolbar';
import { useTimelineData } from './use-timeline-data';
import { useTimelineRange } from './use-timeline-range';
import './harvest-timeline-page.css';

const HOVER_CLOSE_DELAY = 220;

export function HarvestTimelinePage() {
  const { t, language } = useLanguage();
  const { isOn } = useConfiguration();
  const greenhouseOn = isOn(GREENHOUSE_CONFIG);
  const data = useTimelineData(greenhouseOn);
  const forecast = useForecast();

  const range = useTimelineRange(!data.loading);
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const [form, setForm] = useState<{ date: string; kind: HarvestKind } | null>(null);
  const [dayMenu, setDayMenu] = useState<{
    harvest: TimelineHarvest;
    date: string;
    x: number;
    y: number;
  } | null>(null);
  const [hover, setHover] = useState<{ key: string; anchor: DOMRect } | null>(null);
  const [sticky, setSticky] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>(readStoredFilters);

  const today = useMemo(() => new Date(), []);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    writeStoredFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (data.loading || filters.target === 'all') return;
    const allowed = optionsForKind(data.targetOptions, filters.kind);
    if (allowed.some((option) => option.value === filters.target)) return;
    setFilters((prev) => ({ ...prev, target: 'all' }));
  }, [data.loading, data.targetOptions, filters.kind, filters.target]);

  function cancelClose() {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function scheduleClose() {
    if (sticky) return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => setHover(null), HOVER_CLOSE_DELAY);
  }

  const { days } = range;
  const title = `${formatLocalizedDate(days[0], language)} – ${formatLocalizedDate(days[days.length - 1], language, { year: true })}`;
  const hovered = hover ? (data.harvests.find((item) => item.key === hover.key) ?? null) : null;

  const visible = useMemo(
    () => applyFilters(data.harvests, filters, data.targets),
    [data.harvests, filters, data.targets]
  );

  return (
    <div className="hcal-timeline-page page-fill">
      <div className="page-fill-header hcal-timeline-header">
        <HarvestTimelineToolbar
          title={title}
          dayCount={range.dayCount}
          onToday={range.goToday}
          onPrev={() => range.shift(-1)}
          onNext={() => range.shift(1)}
          onZoom={range.zoom}
          onAdd={() => setPendingDate(toIsoDate(days[0]))}
        />

        <HarvestTimelineFilterBar
          filters={filters}
          options={data.targetOptions}
          greenhouseOn={greenhouseOn}
          onChange={setFilters}
          onClear={() => setFilters(EMPTY_FILTERS)}
        />

        <div className="hcal-timeline-meta">
          <p className="hcal-timeline-hint">{t('harvestTimeline.scrollHint')}</p>
          <WeatherStrip />
        </div>

        {data.error && <div className="error-banner">{data.error}</div>}
      </div>

      {data.loading ? (
        <div className="state-box">…</div>
      ) : (
        <div ref={range.scrollRef} className="hcal-timeline-scroll page-fill-scroll">
          <HarvestTimelineGrid
            days={days}
            today={today}
            harvests={visible}
            emptyText={t(isFiltering(filters) ? 'harvestTimeline.noMatches' : 'harvestTimeline.empty')}
            seedIcons={data.seedIcons}
            dayActivities={data.dayActivities}
            forecast={forecast}
            onPickDay={(day) => setPendingDate(toIsoDate(day))}
            onMarkDay={(harvest, date, at) => setDayMenu({ harvest, date, ...at })}
            onHover={(harvest, rect) => {
              cancelClose();
              setHover({ key: harvest.key, anchor: rect });
            }}
            onLeave={scheduleClose}
          />
        </div>
      )}

      {hovered && hover && (
        <HarvestTimelineCard
          harvest={hovered}
          anchor={hover.anchor}
          seeds={data.seedDetails.get(hovered.key) ?? []}
          saving={data.saving}
          onPatch={(patch) => data.patchHarvest(hovered, patch)}
          onEnter={() => {
            cancelClose();
            setSticky(true);
          }}
          onLeave={() => {
            setSticky(false);
            cancelClose();
            closeTimer.current = window.setTimeout(() => setHover(null), HOVER_CLOSE_DELAY);
          }}
        />
      )}

      {dayMenu && (
        <HarvestTimelineDayMenu
          x={dayMenu.x}
          y={dayMenu.y}
          activities={data.activitiesFor(dayMenu.harvest, dayMenu.date)}
          onToggle={(activity) => data.toggleActivity(dayMenu.harvest, dayMenu.date, activity)}
          onRemove={() => {
            data.unmarkDay(dayMenu.harvest, dayMenu.date);
            setDayMenu(null);
          }}
          onClose={() => setDayMenu(null)}
        />
      )}

      <HarvestTimelineKindModal
        open={pendingDate != null}
        onPick={(kind) => {
          setForm({ date: pendingDate ?? toIsoDate(days[0]), kind });
          setPendingDate(null);
        }}
        onClose={() => setPendingDate(null)}
      />

      <HarvestFormModal
        open={form != null}
        kind={form?.kind ?? 'Crop'}
        editingHarvest={null}
        presetDate={form?.date}
        onClose={() => setForm(null)}
        onSaved={data.upsertHarvest}
      />
    </div>
  );
}
