import { KindDropdown } from '@/components/farm/kind-dropdown';
import type { KindOption } from '@/components/farm/kind-picker';
import { useLanguage } from '@/contexts/language-context';
import './harvest-inline-add.css';

type Props = {
  options: KindOption[];
  value: string;
  onValue: (value: string) => void;
  amount: string;
  onAmount: (value: string) => void;
  unitLabel: string;
  hint?: string | null;
  error?: string | null;
  emptyText: string;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
};

/** The add row of a detail section, opened in place of the add button — a target and an amount,
 *  which is all a seed or a result carries. */
export function HarvestInlineAdd({
  options,
  value,
  onValue,
  amount,
  onAmount,
  unitLabel,
  hint,
  error,
  emptyText,
  saving,
  canSave,
  onSave,
  onCancel,
}: Props) {
  const { t } = useLanguage();

  if (options.length === 0) {
    return <p className="hd-empty">{emptyText}</p>;
  }

  return (
    <div className="hd-inline">
      {error && <div className="error-banner">{error}</div>}

      <div className="hd-inline-fields">
        <div className="field">
          <label>{t('farm.type')}</label>
          <KindDropdown options={options} selected={value} onSelect={onValue} />
        </div>

        <div className="field hd-inline-amount">
          <label>{t('farm.amount')}</label>
          <input
            value={amount}
            onChange={(e) => onAmount(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
            inputMode="decimal"
            autoFocus
          />
          {(hint || unitLabel) && <span className="limit-hint">{hint ?? unitLabel}</span>}
        </div>
      </div>

      <div className="hd-inline-actions">
        <button type="button" className="hd-button" onClick={onCancel} disabled={saving}>
          {t('common.cancel')}
        </button>
        <button type="button" className="hd-button primary" onClick={onSave} disabled={!canSave}>
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
