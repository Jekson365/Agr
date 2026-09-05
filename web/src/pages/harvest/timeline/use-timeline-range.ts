import { useEffect, useRef, useState } from 'react';

import { buildDays, clampDays } from './harvest-timeline-spans';

const DEFAULT_DAYS = 7;
const PAN_STEP_PX = 42;

function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return start;
}

export function useTimelineRange(ready: boolean) {
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [dayCount, setDayCount] = useState(DEFAULT_DAYS);

  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<(direction: number) => void>(() => {});
  const panRef = useRef<(delta: number) => void>(() => {});
  const panAccumulator = useRef(0);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        panRef.current(e.deltaX);
        return;
      }
      if (e.deltaY === 0) return;
      e.preventDefault();
      if (e.shiftKey) {
        panRef.current(e.deltaY);
        return;
      }
      zoomRef.current(e.deltaY > 0 ? 1 : -1);
    }

    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [ready]);

  function zoom(direction: number) {
    const step = Math.max(1, Math.round(dayCount * 0.2));
    const next = clampDays(dayCount + direction * step);
    if (next === dayCount) return;

    const middle = new Date(anchor);
    middle.setDate(middle.getDate() + Math.floor(dayCount / 2));
    const shifted = new Date(middle);
    shifted.setDate(shifted.getDate() - Math.floor(next / 2));

    setDayCount(next);
    setAnchor(shifted);
  }

  function pan(delta: number) {
    panAccumulator.current += delta;
    const steps = Math.trunc(panAccumulator.current / PAN_STEP_PX);
    if (steps === 0) return;

    panAccumulator.current -= steps * PAN_STEP_PX;
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + steps);
      return next;
    });
  }

  zoomRef.current = zoom;
  panRef.current = pan;

  function shift(direction: number) {
    setAnchor((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction * dayCount);
      return next;
    });
  }

  return {
    days: buildDays(anchor, dayCount),
    dayCount,
    scrollRef,
    zoom,
    shift,
    goToday: () => setAnchor(startOfWeek(new Date())),
  };
}
