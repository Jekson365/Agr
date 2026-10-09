import { formatLocalizedIsoDateTime, formatLocalizedIsoDay, type DateLanguage } from '@/components/ui/date-utils';
import type { AdminUser } from '@/types/admin';

export function lastActiveLabel(user: Pick<AdminUser, 'lastActiveAt' | 'lastActiveOn'>, language: DateLanguage): string {
  const { lastActiveAt, lastActiveOn } = user;
  if (lastActiveAt && (!lastActiveOn || lastActiveAt.slice(0, 10) >= lastActiveOn)) {
    return formatLocalizedIsoDateTime(lastActiveAt, language);
  }
  if (lastActiveOn) return formatLocalizedIsoDay(lastActiveOn, language);
  return '—';
}
