import { useState } from 'react';

import { buildDays } from '@/pages/harvest/timeline/harvest-timeline-spans';

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(anchor: Date): number {
  return new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
}

export function useMonthRange() {
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));

  function shift(direction: number) {
    setAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  }

  return {
    anchor,
    days: buildDays(anchor, daysInMonth(anchor)),
    shift,
    goToday: () => setAnchor(startOfMonth(new Date())),
  };
}
