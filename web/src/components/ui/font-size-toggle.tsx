import { useFontSize } from '@/contexts/font-size-context';
import { useLanguage } from '@/contexts/language-context';
import './font-size-toggle.css';

export function FontSizeToggle() {
  const { canDecrease, canIncrease, decrease, increase } = useFontSize();
  const { t } = useLanguage();

  return (
    <div className="font-size-toggle" role="group" aria-label={t('fontSize.label')}>
      <button
        type="button"
        className="font-size-btn font-size-btn-small"
        onClick={decrease}
        disabled={!canDecrease}
        aria-label={t('fontSize.decrease')}
        title={t('fontSize.decrease')}
      >
        A−
      </button>
      <button
        type="button"
        className="font-size-btn"
        onClick={increase}
        disabled={!canIncrease}
        aria-label={t('fontSize.increase')}
        title={t('fontSize.increase')}
      >
        A+
      </button>
    </div>
  );
}
