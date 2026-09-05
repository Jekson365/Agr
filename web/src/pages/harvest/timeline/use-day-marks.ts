import { useMemo, useState } from 'react';

import type { HarvestActivity } from '@/config/harvest-activity';
import { createHarvestEvent, deleteHarvestEvent } from '@/services/harvest-event-service';
import type { HarvestEvent } from '@/types/harvest-event';
import { harvestIdOf, type TimelineHarvest } from './harvest-timeline-spans';

/** The marks a harvest's days carry: which field work is booked on which day, and the words that
 *  describe it. Kept apart from the rest of the timeline's data, which never reads an event. */
export function useDayMarks(harvests: TimelineHarvest[], t: (key: string) => string) {
  const [events, setEvents] = useState<HarvestEvent[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** What each marked day carries, keyed by span and date. A day with no entry carries no mark,
   *  so this is what the grid both colours and draws its icons from. */
  const dayActivities = useMemo(() => {
    const cells = new Map<string, string[]>();
    const keyById = new Map(
      harvests.filter((item) => item.source !== 'greenhouse').map((item) => [harvestIdOf(item), item.key])
    );
    for (const event of events) {
      const key = keyById.get(event.harvestId);
      if (!key) continue;
      const cell = `${key}|${event.date.slice(0, 10)}`;
      const before = cells.get(cell);
      if (before) before.push(event.description);
      else cells.set(cell, [event.description]);
    }
    return cells;
  }, [events, harvests]);

  function markedOn(harvest: TimelineHarvest, date: string): HarvestEvent[] {
    const id = harvestIdOf(harvest);
    return events.filter((event) => event.harvestId === id && event.date.slice(0, 10) === date);
  }

  function activitiesFor(harvest: TimelineHarvest, date: string): string[] {
    return markedOn(harvest, date).map((event) => event.description);
  }

  /** Greenhouse harvests are not marked — the rows hang off a field harvest, and one is not that. */
  async function toggleActivity(harvest: TimelineHarvest, date: string, activity: HarvestActivity) {
    if (harvest.source === 'greenhouse') return;
    const existing = markedOn(harvest, date).find((event) => event.description === activity);

    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await deleteHarvestEvent(existing.id);
        setEvents((prev) => prev.filter((event) => event.id !== existing.id));
        return;
      }
      const created = await createHarvestEvent({
        harvestId: harvestIdOf(harvest),
        date,
        description: activity,
      });
      setEvents((prev) => [...prev, created]);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function unmarkDay(harvest: TimelineHarvest, date: string) {
    const marked = markedOn(harvest, date);
    if (marked.length === 0) return;

    setSaving(true);
    setError(null);
    try {
      await Promise.all(marked.map((event) => deleteHarvestEvent(event.id)));
      setEvents((prev) => prev.filter((event) => !marked.some((row) => row.id === event.id)));
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return { setEvents, dayActivities, activitiesFor, toggleActivity, unmarkDay, saving, error };
}
