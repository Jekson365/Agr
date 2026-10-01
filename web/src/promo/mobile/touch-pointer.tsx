import { enter } from '@/promo/motion';
import { tabCenter } from '@/promo/mobile/layout';
import { buildPointerPath, POINTER_APPEAR, positionOn, pressAt } from '@/promo/pointer-path';
import { OUTRO_START, windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

const SIZE = 86;

const PATH = buildPointerPath({ x: 820, y: 1540 }, tabCenter, [
  { x: 850, y: 1560 },
  { x: 790, y: 1540 },
  { x: 860, y: 1570 },
  { x: 760, y: 1550 },
  { x: 840, y: 1565 },
]);

export function TouchPointer() {
  const time = useClock();
  const leave = enter(time, OUTRO_START - 0.45, 0.3);
  const shown = time >= POINTER_APPEAR && leave < 1;
  const point = positionOn(PATH, time);

  return (
    <span
      className="promo-touch"
      style={{
        visibility: shown ? 'visible' : 'hidden',
        opacity: Math.min(enter(time, POINTER_APPEAR, 0.25), 1 - leave),
        width: SIZE,
        height: SIZE,
        left: point.x - SIZE / 2,
        top: point.y + windowFloat(time) - SIZE / 2,
        transform: `scale(${1 - 0.22 * pressAt(time)})`,
      }}
    />
  );
}
