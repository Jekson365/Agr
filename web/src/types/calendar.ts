export type CalendarEvent = {
  id: number;
  title: string;
  /** ISO date string (YYYY-MM-DD). */
  date: string;
  /** 24-hour time string (HH:mm or HH:mm:ss). */
  time: string;
};

export type CalendarEventInput = Omit<CalendarEvent, 'id'>;
