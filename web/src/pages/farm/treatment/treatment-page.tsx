import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { monthNames } from '@/components/ui/date-utils';
import { TREE_TREATMENTS } from '@/config/tree-treatment';
import { useLanguage } from '@/contexts/language-context';
import type { TreeTreatment } from '@/types/tree-treatment';
import { TreatmentCalendar } from './treatment-calendar';
import { TreatmentDayMenu } from './treatment-day-menu';
import { TreatmentFilterRow } from './treatment-filter-row';
import { TreatmentFruitRow } from './treatment-fruit-row';
import { TreatmentToolbar } from './treatment-toolbar';
import { useMonthRange } from './use-month-range';
import { useTreatments } from './use-treatments';
import './treatment.css';

type DayMenu = { orchardId: number; date: string; x: number; y: number };

export function TreatmentPage() {
  const { t, language } = useLanguage();
  const state = useTreatments();
  const range = useMonthRange();

  const [selectedIds, setSelectedIds] = useState<number[] | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => [...TREE_TREATMENTS]);
  const [menu, setMenu] = useState<DayMenu | null>(null);

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
        <div className="trt-scroll page-fill-scroll">
          <TreatmentCalendar
            days={days}
            today={today}
            orchards={visible}
            dayTreatments={shown}
            emptyText={t(state.orchards.length === 0 ? 'treatment.noOrchards' : 'treatment.pickOrchard')}
            onPickDay={(orchardId, date, at) => setMenu({ orchardId, date, ...at })}
          />
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
