import { STORAGE_PLAN_LABEL_KEY } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import '@/components/farm/plan/plan-limit.css';

type Props = {
  count: number;
  max: number | null;
  onClick: () => void;
};

export function LimitCounter({ count, max, onClick }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();

  if (max == null || !user) return null;

  const planName = t(STORAGE_PLAN_LABEL_KEY[user.plan]);

  return (
    <button
      type="button"
      className={count >= max ? 'limit-counter is-full' : 'limit-counter'}
      aria-label={`${planName} ${count} / ${max}`}
      onClick={onClick}
    >
      <span className="limit-counter-plan">{planName}</span>
      <span className="limit-counter-value">
        {count} / {max}
      </span>
    </button>
  );
}
