import { backOut, easeOut, enter, mix, wave } from '@/promo/motion';
import { WN_REPORT } from '@/promo/winery/wn-copy';
import { Lari } from '@/promo/winery/wn-money';
import { STEP_AT, WINE } from '@/promo/winery/wn-timeline';

export function WnReport({ time }: { time: number }) {
  const at = STEP_AT[3];
  if (time < at) return null;
  const ring = enter(time, at + 1.3, 0.45, backOut);
  const pulse = time > at + 1.75 ? 0.5 + wave(time, 1.2, 0.5) : 0;

  return (
    <div className="wn-report">
      {WN_REPORT.map((row, index) => {
        const shown = enter(time, at + 0.25 + index * 0.15, 0.4, easeOut);
        const grow = enter(time, at + 0.35 + index * 0.15, 0.8, easeOut);
        const profit = row.key === 'profit';
        return (
          <div
            key={row.key}
            className={`wn-report-row is-${row.key}`}
            style={{
              opacity: shown,
              transform: `translateX(${mix(-24, 0, shown)}px) scale(${profit ? mix(1, 1.03, ring) : 1})`,
              boxShadow: profit ? `0 0 0 ${3 * ring + 2 * pulse}px var(--color-green)` : undefined,
            }}
          >
            <span className="wn-report-label">{row.label}</span>
            <span className="wn-report-track">
              <span className="wn-report-bar" style={{ width: `${(row.value / WINE.revenue) * 100 * grow}%` }} />
            </span>
            <strong className="wn-report-value">
              <Lari value={row.value * grow} />
            </strong>
          </div>
        );
      })}
    </div>
  );
}
