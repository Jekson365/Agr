import { clamp, easeInOut, enter, mix, progress } from '@/promo/motion';
import { clickTime, LAST_SCREEN, navCenter, OUTRO_START, windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

type Point = { time: number; x: number; y: number };

const APPEAR = 3.3;
const HOTSPOT = { x: 5.5, y: 3.7 };

const RESTS = [
  { x: 1500, y: 610 },
  { x: 1520, y: 520 },
  { x: 1560, y: 470 },
  { x: 1620, y: 560 },
  { x: 1400, y: 560 },
];

function buildPath(): Point[] {
  const start = { x: 1540, y: 860 };
  const points: Point[] = [
    { time: APPEAR, ...start },
    { time: clickTime(1) - 0.5, ...start },
  ];

  for (let index = 1; index <= LAST_SCREEN; index += 1) {
    const click = clickTime(index);
    const nav = navCenter(index);
    const rest = RESTS[index - 1];
    points.push({ time: click - 0.06, ...nav }, { time: click + 0.1, ...nav }, { time: click + 0.62, ...rest });
    if (index < LAST_SCREEN) points.push({ time: clickTime(index + 1) - 0.5, ...rest });
  }

  return points;
}

const PATH = buildPath();

function positionAt(time: number): { x: number; y: number } {
  const next = PATH.findIndex((point) => point.time > time);
  if (next <= 0) return next === 0 ? PATH[0] : PATH[PATH.length - 1];
  const from = PATH[next - 1];
  const to = PATH[next];
  const p = easeInOut(progress(time, from.time, to.time - from.time));
  return { x: mix(from.x, to.x, p), y: mix(from.y, to.y, p) };
}

function pressAt(time: number): number {
  let press = 0;
  for (let index = 1; index <= LAST_SCREEN; index += 1) {
    press = Math.max(press, 1 - clamp(Math.abs(time - clickTime(index)) / 0.1));
  }
  return press;
}

export function Cursor() {
  const time = useClock();
  const leave = enter(time, OUTRO_START - 0.45, 0.3);
  const shown = time >= APPEAR && leave < 1;
  const point = positionAt(time);
  const scale = 1 - 0.16 * pressAt(time);

  return (
    <svg
      className="promo-cursor"
      viewBox="0 0 24 24"
      width="44"
      height="44"
      aria-hidden="true"
      style={{
        visibility: shown ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, APPEAR, 0.25), 1 - leave),
        left: point.x - HOTSPOT.x,
        top: point.y + windowFloat(time) - HOTSPOT.y,
        transform: `scale(${scale})`,
      }}
    >
      <path d="M3 2v17.5l4.5-4.2 2.9 6.3 2.9-1.3-2.8-6.2 6-.1Z" />
    </svg>
  );
}
