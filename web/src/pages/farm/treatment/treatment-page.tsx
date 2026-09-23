import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { monthNames } from '@/components/ui/date-utils';
import { TREE_TREATMENTS } from '@/config/tree-treatment';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { createOrchardBlock, updateOrchardBlock } from '@/services/orchard-block-service';
import { deleteTreeSpotTreatment } from '@/services/tree-spot-treatment-service';
import type { OrchardBlock, OrchardBlockInput } from '@/types/orchard-block';
import type { TreeTreatment } from '@/types/tree-treatment';
import { TreatmentCalendar } from './treatment-calendar';
import { TreatmentDayMenu } from './treatment-day-menu';
import { TreatmentFilterRow } from './treatment-filter-row';
import { TreatmentFruitRow } from './treatment-fruit-row';
import { TreatmentPositioning } from './treatment-positioning';
import { farmOf, locationOf, seedOutline } from './treatment-seed';
import type { SpotGroup } from './treatment-spot-groups';
import { TreatmentToolbar } from './treatment-toolbar';
import { useMonthRange } from './use-month-range';
import { useTreatments } from './use-treatments';
import './treatment.css';

type DayMenu = { orchardId: number; date: string; x: number; y: number };

export function TreatmentPage() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const state = useTreatments();
  const range = useMonthRange();

  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => [...TREE_TREATMENTS]);
  const [menu, setMenu] = useState<DayMenu | null>(null);
  /** The orchard whose planting layout is shown under the calendar. Null until one is clicked. */
  const [activeId, setActiveId] = useState<number | null>(null);

  const today = useMemo(() => new Date(), []);

  const typeCounts = useMemo(() => {
    const totals = new Map<string, number>();
    for (const rows of state.dayTreatments.values()) {
      for (const row of rows) totals.set(row.type, (totals.get(row.type) ?? 0) + 1);
    }
    return totals;
  }, [state.dayTreatments]);

  const shown = useMemo(() => {
    const wanted = new Set(selectedTypes);
    const filtered = new Map<string, TreeTreatment[]>();
    for (const [key, rows] of state.dayTreatments) {
      const keep = rows.filter((row) => wanted.has(row.type));
      if (keep.length > 0) filtered.set(key, keep);
    }
    return filtered;
  }, [state.dayTreatments, selectedTypes]);

  const counts = useMemo(() => {
    const totals = new Map<number, number>();
    for (const rows of shown.values()) {
      for (const row of rows) totals.set(row.treeStockId, (totals.get(row.treeStockId) ?? 0) + 1);
    }
    return totals;
  }, [shown]);

  const { days } = range;
  const rangeLabel = `${monthNames(language)[range.anchor.getMonth()]} ${range.anchor.getFullYear()}`;
  const chosenIds = selectedIds ?? state.orchards.map((row) => row.id);
  const chosenSet = new Set(chosenIds);
  const visible = state.orchards.filter((row) => chosenSet.has(row.id));

  /* From what is on screen, not every orchard: filtering one out takes its panel down with it. */
  const active = visible.find((row) => row.id === activeId) ?? null;
  const activeBlock = state.blocks.find((row) => row.treeStockId === activeId) ?? null;
  const activeSpots = state.spots.filter((row) => row.treeStockId === activeId);

  /* Only used for an orchard with no block yet: the land it sits on, else the profile pin. */
  const activeSeed = useMemo(
    () =>
      active
        ? seedOutline(
            farmOf(active, state.plots, state.farms),
            locationOf(user?.latitude ?? null, user?.longitude ?? null)
          )
        : [],
    [active, state.plots, state.farms, user?.latitude, user?.longitude]
  );

  /* Both the first layout and every later edit are made here, so this writes either way and
     patches the block in hand rather than reloading — the drawing is already showing it. */
  async function saveLayout(input: OrchardBlockInput, existing: OrchardBlock | null) {
    if (!existing) {
      const created = await createOrchardBlock(input);
      state.setBlocks((prev) => [...prev, created]);
      return;
    }

    const next = { ...existing, ...input };
    await updateOrchardBlock(next.id, next);
    state.setBlocks((prev) => prev.map((row) => (row.id === next.id ? next : row)));
  }

  /* A record covers whatever trees it was given to, so removing it takes every row it wrote. A
     delete that failed is left out of the filter, so the list still shows what is really there. */
  async function removeSpot(group: SpotGroup) {
    const gone = await Promise.all(
      group.ids.map((id) => deleteTreeSpotTreatment(id).then(() => id).catch(() => null))
    );
    const removed = new Set(gone.filter((id): id is number => id != null));
    state.setSpots((prev) => prev.filter((entry) => !removed.has(entry.id)));
  }

  return (
    <div className="trt-page page-fill">
      <div className="page-fill-header trt-header">
        <Link to="/farm/fruits" className="back-link">
          ← {t('farm.fruits')}
        </Link>

        <div className="page-header">
          <h1 className="page-title">{t('treatment.title')}</h1>
        </div>

        <div className="trt-filters">
          <TreatmentFruitRow
            orchards={state.orchards}
            selectedIds={chosenIds}
            counts={counts}
            onChange={setSelectedIds}
          />

          <TreatmentFilterRow selected={selectedTypes} counts={typeCounts} onChange={setSelectedTypes} />
        </div>

        <TreatmentToolbar
          range={rangeLabel}
          onToday={range.goToday}
          onPrev={() => range.shift(-1)}
          onNext={() => range.shift(1)}
        />

        <p className="trt-hint">{t('treatment.hint')}</p>

        {state.error && <div className="error-banner">{state.error}</div>}
      </div>

      {state.loading ? (
        <div className="state-box">…</div>
      ) : (
        <div className="trt-body page-fill-scroll">
          <div className="trt-scroll">
            <TreatmentCalendar
              days={days}
              today={today}
              orchards={visible}
              dayTreatments={shown}
              emptyText={t(state.orchards.length === 0 ? 'treatment.noOrchards' : 'treatment.pickOrchard')}
              activeId={activeId}
              onPickDay={(orchardId, date, at) => setMenu({ orchardId, date, ...at })}
              onPickOrchard={(orchardId) => setActiveId((prev) => (prev === orchardId ? null : orchardId))}
            />
          </div>

          {/* Keyed by the orchard: an index from the previous plan means a different tree here. */}
          {visible.length > 0 && (
            <TreatmentPositioning
              key={activeId ?? 'none'}
              orchard={active}
              block={activeBlock}
              spots={activeSpots}
              onSaved={(rows) => state.setSpots((prev) => [...rows, ...prev])}
              onDeleted={removeSpot}
              onLayoutSaved={saveLayout}
              seed={activeSeed}
            />
          )}
        </div>
      )}

      {menu && (
        <TreatmentDayMenu
          x={menu.x}
          y={menu.y}
          assigned={state.treatmentsOn(menu.orchardId, menu.date).map((row) => row.type)}
          onToggle={(type) => state.toggle(menu.orchardId, menu.date, type)}
          onClear={() => {
            state.clearDay(menu.orchardId, menu.date);
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}
