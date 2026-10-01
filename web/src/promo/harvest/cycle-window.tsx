import { tr } from '@/promo/locale';
import { easeIn, easeOut, enter, mix } from '@/promo/motion';
import { CycleList } from '@/promo/harvest/cycle-list';
import { CyclePane } from '@/promo/harvest/cycle-pane';
import {
  CLICK,
  CYCLE_OUTRO,
  CYCLE_WINDOW,
  CYCLE_WINDOW_IN,
  PAGE_ZOOM,
  pressNear,
  scrollOffset,
} from '@/promo/harvest/cycle-timeline';
import { windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import '@/components/harvest/harvest.css';
import '@/pages/harvest/workspace/harvest-workspace.css';
import '@/pages/harvest/workspace/harvest-detail-pane.css';
import '@/pages/harvest/detail/harvest-detail.css';
import '@/pages/harvest/detail/harvest-detail-money.css';
import '@/pages/harvest/detail/harvest-detail-panels.css';
import '@/pages/harvest/detail/harvest-tabs.css';
import '@/promo/window.css';
import '@/promo/harvest/cycle.css';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CycleWindow() {
  const time = useClock();
  const rise = enter(time, CYCLE_WINDOW_IN, 0.85, easeOut);
  const leave = enter(time, CYCLE_OUTRO + 0.1, 0.4, easeIn);
  const shown = time >= CYCLE_WINDOW_IN && leave < 1;

  return (
    <div
      className="promo-window cycle-window"
      style={{
        left: CYCLE_WINDOW.x,
        top: CYCLE_WINDOW.y,
        width: CYCLE_WINDOW.width,
        height: CYCLE_WINDOW.height,
        visibility: shown ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, CYCLE_WINDOW_IN, 0.35), 1 - leave),
        transform: `perspective(2400px) translateY(${mix(180, 0, rise) + windowFloat(time)}px) rotateX(${mix(16, 0, rise)}deg) scale(${mix(0.93, 1, rise)})`,
      }}
    >
      <div className="promo-window-chrome">
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-address">
          <LockIcon />
          mtabari.com.ge/harvest
        </span>
      </div>

      <div className="cycle-window-body">
        <div className="cycle-page" style={{ zoom: PAGE_ZOOM, transform: `translateY(${-scrollOffset(time) / PAGE_ZOOM}px)` }}>
          <div className="hw-page">
            <div className="page-header">
              <h1 className="page-title">{tr('harvest.title')}</h1>
              <button
                type="button"
                className="add-button cycle-add"
                style={{ transform: `scale(${1 - 0.07 * pressNear(time, CLICK.add)})` }}
              >
                + {tr('harvest.add')}
              </button>
            </div>
            <div className="hw-split">
              <CycleList time={time} />
              <CyclePane time={time} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
