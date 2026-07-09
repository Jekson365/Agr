type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Formats the age derived from a birth date into a short, localized label such as
 * "3y 2mo", "5mo" or "12d". Returns null when the date is missing or unparseable.
 */
export function formatAge(bornDate: string | null | undefined, t: Translate): string | null {
  if (!bornDate) return null;

  const born = new Date(bornDate);
  if (Number.isNaN(born.getTime())) return null;

  const now = new Date();
  if (born.getTime() > now.getTime()) return null;

  // Whole calendar months between the two dates.
  let months = (now.getFullYear() - born.getFullYear()) * 12 + (now.getMonth() - born.getMonth());
  if (now.getDate() < born.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0) {
    return remainingMonths > 0
      ? `${years}${t('livestockDetail.yearShort')} ${remainingMonths}${t('livestockDetail.monthShort')}`
      : `${years}${t('livestockDetail.yearShort')}`;
  }

  if (months > 0) {
    return `${months}${t('livestockDetail.monthShort')}`;
  }

  const days = Math.max(0, Math.floor((now.getTime() - born.getTime()) / 86_400_000));
  return `${days}${t('livestockDetail.dayShort')}`;
}
