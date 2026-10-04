import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import './amount-field.css';

type Props = {
  caption: string;
  amount: number;
  unitLabel: string;
  disabled: boolean;
  onSave: (amount: number) => Promise<void>;
};

function shown(amount: number): string {
  return amount > 0 ? String(amount) : '';
}

export function AmountField({ caption, amount, unitLabel, disabled, onSave }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState(shown(amount));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setValue(shown(amount));
  }, [amount]);

  async function save() {
    const next = Math.max(0, parseFloat(value) || 0);
    if (next === amount) {
      setValue(shown(next));
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      await onSave(next);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className={failed ? 'picked-amount failed' : 'picked-amount'} title={failed ? t('farm.saveError') : caption}>
      <span className="picked-amount-caption">{caption}</span>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={value}
        disabled={disabled || saving}
        placeholder="0"
        aria-label={caption}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
      />
      <span className="picked-amount-unit">{unitLabel}</span>
    </label>
  );
}
