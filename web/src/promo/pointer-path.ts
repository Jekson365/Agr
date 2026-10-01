import { clamp, easeInOut, mix, progress } from '@/promo/motion';
import { clickTime, LAST_SCREEN } from '@/promo/timeline';

type Spot = { x: number; y: number };
export type PathPoint = Spot & { time: number };

export const POINTER_APPEAR = 3.3;

export function buildPointerPath(start: Spot, target: (index: number) => Spot, rests: Spot[]): PathPoint[] {
  const points: PathPoint[] = [
    { time: POINTER_APPEAR, ...start },
    { time: clickTime(1) - 0.5, ...start },
  ];

  for (let index = 1; index <= LAST_SCREEN; index += 1) {
    const click = clickTime(index);
    const spot = target(index);
    const rest = rests[index - 1];
    points.push({ time: click - 0.06, ...spot }, { time: click + 0.1, ...spot }, { time: click + 0.62, ...rest });
    if (index < LAST_SCREEN) points.push({ time: clickTime(index + 1) - 0.5, ...rest });
  }

  return points;
}

export function positionOn(path: PathPoint[], time: number): Spot {
  const next = path.findIndex((point) => point.time > time);
  if (next <= 0) return next === 0 ? path[0] : path[path.length - 1];
  const from = path[next - 1];
  const to = path[next];
  const p = easeInOut(progress(time, from.time, to.time - from.time));
  return { x: mix(from.x, to.x, p), y: mix(from.y, to.y, p) };
}

export function pressAt(time: number): number {
  let press = 0;
  for (let index = 1; index <= LAST_SCREEN; index += 1) {
    press = Math.max(press, 1 - clamp(Math.abs(time - clickTime(index)) / 0.1));
  }
  return press;
}
