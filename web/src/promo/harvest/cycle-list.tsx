import type { ReactNode } from 'react';

import harvestIcon from '@/assets/icons/harvest.png';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { stockKindImage } from '@/config/stock-kinds';
import { tr } from '@/promo/locale';
import { backOut, easeOut, enter, mix } from '@/promo/motion';
import { SAMPLE } from '@/promo/harvest/cycle-copy';
import { NEW_ROW_AT, tomatoStatus } from '@/promo/harvest/cycle-timeline';
import type { HarvestStatus } from '@/types/harvest';

const SELECT_AT = NEW_ROW_AT + 0.12;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

type RowProps = { title: string; type: string; status: HarvestStatus; selected: boolean; pop?: number };

function Row({ title, type, status, selected, pop = 1 }: RowProps) {
  return (
    <button type="button" className={selected ? 'hw-row selected' : 'hw-row'}>
      <span className="hw-row-mark">
        <img className="hw-row-icon" src={harvestIcon} alt="" />
        <img className="hw-row-good" src={stockKindImage(type)} alt="" />
      </span>
      <span className="hw-row-main">
        <span className="hw-row-title">{title}</span>
        <span
          className={`${HARVEST_STATUS_BADGE_CLASS[status]} harvest-status-badge`}
          style={{ transform: `scale(${mix(0.7, 1, pop)})` }}
        >
          {tr(HARVEST_STATUS_LABEL_KEY[status])}
        </span>
      </span>
    </button>
  );
}

export function CycleList({ time }: { time: number }) {
  const grow = enter(time, NEW_ROW_AT, 0.4, easeOut);
  const { status, since } = tomatoStatus(time);
  const tomatoSelected = time >= SELECT_AT;
  const count = time >= NEW_ROW_AT ? 3 : 2;

  return (
    <aside className="hw-list">
      <div className="hw-list-head">
        <h2 className="hw-list-title">{tr('harvest.title')}</h2>
        <button type="button" className="hw-fold">
          <Icon>
            <path d="m15 18-6-6 6-6" />
          </Icon>
        </button>
      </div>

      <div className="search-row hw-search">
        <label className="search-field">
          <Icon>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </Icon>
          <input placeholder={tr('harvest.searchPlaceholder')} readOnly />
        </label>
        <button type="button" className="filter-toggle">
          <Icon>
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
          </Icon>
        </button>
      </div>

      <div className="hw-rows">
        {grow > 0 && (
          <div className="cycle-grow" style={{ gridTemplateRows: `${grow}fr`, marginBottom: mix(-8, 0, grow) }}>
            <div className="cycle-grow-inner" style={{ opacity: grow, transform: `translateX(${mix(-24, 0, grow)}px)` }}>
              <Row
                title={SAMPLE.tomato}
                type="Tomato"
                status={status}
                selected={tomatoSelected}
                pop={enter(time, since, 0.45, backOut)}
              />
            </div>
          </div>
        )}
        <Row title={SAMPLE.cucumber} type="Cucumber" status="Flowering" selected={!tomatoSelected} />
        <Row title={SAMPLE.cabbage} type="Cabbage" status="Planning" selected={false} />
      </div>

      <p className="hw-list-count">
        {count} / {count}
      </p>
    </aside>
  );
}
