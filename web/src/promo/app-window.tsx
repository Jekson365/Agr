import { easeIn, easeOut, enter, mix } from '@/promo/motion';
import { Screens } from '@/promo/screens/screens';
import { Sidebar } from '@/promo/sidebar';
import { OUTRO_START, STAGE_IN, WINDOW_BOX, windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';
import '@/promo/window.css';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function AppWindow() {
  const time = useClock();
  const rise = enter(time, STAGE_IN + 0.05, 0.85, easeOut);
  const leave = enter(time, OUTRO_START + 0.1, 0.4, easeIn);
  const shown = time >= STAGE_IN && leave < 1;

  return (
    <div
      className="promo-window"
      style={{
        left: WINDOW_BOX.x,
        top: WINDOW_BOX.y,
        width: WINDOW_BOX.width,
        height: WINDOW_BOX.height,
        visibility: shown ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, STAGE_IN + 0.05, 0.35), 1 - leave),
        transform: `perspective(2200px) translateY(${mix(200, 0, rise) + windowFloat(time)}px) rotateX(${mix(20, 0, rise)}deg) scale(${mix(0.9, 1, rise)})`,
      }}
    >
      <div className="promo-window-chrome">
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-dot" />
        <span className="promo-window-address">
          <LockIcon />
          mtabari.com.ge
        </span>
      </div>

      <div className="promo-window-body">
        <Sidebar />
        <div className="promo-window-main">
          <Screens />
        </div>
      </div>
    </div>
  );
}
