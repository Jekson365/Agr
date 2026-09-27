import type { CSSProperties } from 'react';

export type Ease = (p: number) => number;

export const easeOut: Ease = (p) => 1 - (1 - p) ** 3;
export const easeIn: Ease = (p) => p ** 3;
export const easeInOut: Ease = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);
export const backOut: Ease = (p) => 1 + 2.70158 * (p - 1) ** 3 + 1.70158 * (p - 1) ** 2;

export function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function progress(time: number, start: number, duration: number): number {
  return clamp((time - start) / duration);
}

export function mix(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

export function enter(time: number, start: number, duration: number, ease: Ease = easeOut): number {
  return ease(progress(time, start, duration));
}

export function wave(time: number, period: number, amplitude: number, phase = 0): number {
  return Math.sin(((time + phase) / period) * Math.PI * 2) * amplitude;
}

export function fadeUp(time: number, start: number, distance = 20, duration = 0.5): CSSProperties {
  const p = enter(time, start, duration);
  return { opacity: p, transform: `translateY(${mix(distance, 0, p)}px)` };
}

export function slideIn(time: number, start: number, distance = 40, duration = 0.5): CSSProperties {
  const p = enter(time, start, duration);
  return { opacity: p, transform: `translateX(${mix(distance, 0, p)}px)` };
}

export function popIn(time: number, start: number, duration = 0.5, from = 0.4): CSSProperties {
  const p = enter(time, start, duration, backOut);
  return { opacity: clamp(p * 1.6), transform: `scale(${mix(from, 1, p)})` };
}

export function shownBetween(time: number, from: number, to: number): CSSProperties {
  return time >= from && time < to ? {} : { visibility: 'hidden' };
}
