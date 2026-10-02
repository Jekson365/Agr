import { useLanguage } from '@/contexts/language-context';

const PERIODS: { days: number; labelKey: string }[] = [
  { days: 1, labelKey: 'visitors.period24h' },
  { days: 7, labelKey: 'visitors.period7d' },
  { days: 30, labelKey: 'visitors.period30d' },
  { days: 90, labelKey: 'visitors.period90d' },
  { days: 365, labelKey: 'visitors.period1y' },
  { days: 0, labelKey: 'visitors.periodAll' },
];

type Props = {
  days: number;
  onDays: (days: number) => void;
  includeBots: boolean;
  onIncludeBots: (value: boolean) => void;
};

export function VisitorsToolbar({ days, onDays, includeBots, onIncludeBots }: Props) {
  const { t } = useLanguage();

  return (
    <div className="visitors-toolbar">
      <div className="filter-row visitors-periods">
        {PERIODS.map((period) => (
          <button
            key={period.days}
            type="button"
            className={days === period.days ? 'kind-chip active' : 'kind-chip'}
            onClick={() => onDays(period.days)}
          >
            {t(period.labelKey)}
          </button>
        ))}
      </div>

      <label className="field-checkbox visitors-bots">
        <input type="checkbox" checked={includeBots} onChange={(event) => onIncludeBots(event.target.checked)} />
        {t('visitors.includeBots')}
      </label>
    </div>
  );
}
