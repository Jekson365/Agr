import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toIsoDate } from '@/components/ui/date-utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getCalendarEvents } from '@/services/calendar-service';
import { getLastNotifiedDate, setLastNotifiedDate } from '@/services/notification-storage';
import type { AppNotification } from '@/types/notification';

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  markAllRead: () => void;
};

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const STRINGS: Record<'en' | 'ka', { title: string; body: (entries: string[]) => string }> = {
  en: {
    title: "Today's events",
    body: (entries) =>
      entries.length === 1 ? `You have 1 event today: ${entries[0]}.` : `You have ${entries.length} events today: ${entries.join(', ')}.`,
  },
  ka: {
    title: 'დღევანდელი ღონისძიებები',
    body: (entries) =>
      entries.length === 1
        ? `დღეს გაქვთ 1 ღონისძიება: ${entries[0]}.`
        : `დღეს გაქვთ ${entries.length} ღონისძიება: ${entries.join(', ')}.`,
  },
};

/** Formats a `HH:mm` or `HH:mm:ss` time string for display (e.g. "9:30 AM"). */
function formatEventTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // On the first app entry of the day for this user, check today's calendar events and
  // surface a single notification summarizing them. Runs once per calendar day per user,
  // whether that entry is a fresh login or a resumed session.
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let cancelled = false;

    (async () => {
      const today = toIsoDate(new Date());
      const lastNotified = await getLastNotifiedDate(user.id);
      if (lastNotified === today) return;

      try {
        const events = await getCalendarEvents();
        if (cancelled) return;

        const todaysEvents = events.filter((e) => e.date === today);
        if (todaysEvents.length > 0) {
          const strings = STRINGS[language];
          const notification: AppNotification = {
            id: `today-${today}`,
            title: strings.title,
            body: strings.body(todaysEvents.map((e) => `${formatEventTime(e.time)} ${e.title}`)),
            createdAt: new Date().toISOString(),
            read: false,
          };
          setNotifications((prev) => [notification, ...prev.filter((n) => n.id !== notification.id)]);
        }
        // Only mark today as checked once the fetch actually succeeds, so a failed
        // attempt (offline, server down) retries on the next app entry instead of
        // silently skipping the day.
        await setLastNotifiedDate(user.id, today);
      } catch {
        // Best-effort: if the check fails, just try again next entry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user, language]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAllRead: () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true }))),
    }),
    [notifications, unreadCount]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
