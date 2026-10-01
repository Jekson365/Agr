import { enter } from '@/promo/motion';
import { buildPointerPath, POINTER_APPEAR, positionOn, pressAt } from '@/promo/pointer-path';
import { navCenter, OUTRO_START, windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

const HOTSPOT = { x: 5.5, y: 3.7 };

const PATH = buildPointerPath({ x: 1540, y: 860 }, navCenter, [
  { x: 1500, y: 610 },
  { x: 1520, y: 520 },
  { x: 1560, y: 470 },
  { x: 1620, y: 560 },
  { x: 1400, y: 560 },
]);

export function Cursor() {
  const time = useClock();
  const leave = enter(time, OUTRO_START - 0.45, 0.3);
  const shown = time >= POINTER_APPEAR && leave < 1;
  const point = positionOn(PATH, time);
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
        opacity: Math.min(enter(time, POINTER_APPEAR, 0.25), 1 - leave),
        left: point.x - HOTSPOT.x,
        top: point.y + windowFloat(time) - HOTSPOT.y,
        transform: `scale(${scale})`,
      }}
    >
      <path d="M3 2v17.5l4.5-4.2 2.9 6.3 2.9-1.3-2.8-6.2 6-.1Z" />
    </svg>
  );
}
