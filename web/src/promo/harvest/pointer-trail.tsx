import { easeOut, enter, mix } from '@/promo/motion';
import { positionOn, type PathPoint } from '@/promo/pointer-path';
import type { Spot } from '@/promo/harvest/cycle-targets';
import { pressNear } from '@/promo/harvest/cycle-timeline';
import { windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

const HOTSPOT = { x: 5.5, y: 3.7 };

export type Visit = [number, Spot, Spot?];

type TrailProps = { visits: Visit[]; start: Spot; exit: Spot; appearAt: number; leaveAt: number };

function buildTrail(visits: Visit[], start: Spot, exit: Spot, appearAt: number): PathPoint[] {
  const points: PathPoint[] = [{ time: appearAt, ...start }];
  let previous: Spot = start;
  for (const [at, spot, rest] of visits) {
    const last = points[points.length - 1].time;
    if (at - 0.5 > last) points.push({ time: at - 0.5, ...previous });
    points.push({ time: at - 0.06, ...spot }, { time: at + 0.1, ...spot });
    previous = spot;
    if (rest) {
      points.push({ time: at + 0.65, ...rest });
      previous = rest;
    }
  }
  const lastVisit = visits[visits.length - 1][0];
  points.push({ time: lastVisit + 0.7, ...exit });
  return points;
}

function Ripple({ time, at, spot }: { time: number; at: number; spot: Spot }) {
  if (time < at || time > at + 0.55) return null;
  const grow = enter(time, at, 0.55, easeOut);
  const size = mix(16, 120, grow);
  return (
    <span
      className="cycle-ripple"
      style={{
        left: spot.x - size / 2,
        top: spot.y + windowFloat(time) - size / 2,
        width: size,
        height: size,
        opacity: 0.35 * (1 - grow),
      }}
    />
  );
}

export function PointerTrail({ visits, start, exit, appearAt, leaveAt }: TrailProps) {
  const time = useClock();
  const path = buildTrail(visits, start, exit, appearAt);
  const leave = enter(time, leaveAt, 0.3);
  const shown = time >= appearAt && leave < 1;
  const point = positionOn(path, time);
  const press = Math.max(...visits.map(([at]) => pressNear(time, at)));

  return (
    <>
      {visits.map(([at, spot]) => (
        <Ripple key={at} time={time} at={at} spot={spot} />
      ))}
      <svg
        className="promo-cursor"
        viewBox="0 0 24 24"
        width="44"
        height="44"
        aria-hidden="true"
        style={{
          visibility: shown ? 'visible' : 'hidden',
          opacity: Math.min(enter(time, appearAt, 0.25), 1 - leave),
          left: point.x - HOTSPOT.x,
          top: point.y + windowFloat(time) - HOTSPOT.y,
          transform: `scale(${1 - 0.16 * press})`,
        }}
      >
        <path d="M3 2v17.5l4.5-4.2 2.9 6.3 2.9-1.3-2.8-6.2 6-.1Z" />
      </svg>
    </>
  );
}
