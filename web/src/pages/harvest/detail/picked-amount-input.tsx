import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { updateHarvestTree } from '@/services/harvest-tree-service';
import type { HarvestTree } from '@/types/harvest-tree';
import './picked-amount-input.css';

type Props = {
  tree: HarvestTree;
  label: string;
  unitLabel: string;
  disabled: boolean;
  onSaved: (saved: HarvestTree) => void;
};

function shown(amount: number): string {
  return amount > 0 ? String(amount) : '';
}

export function PickedAmountInput({ tree, label, unitLabel, disabled, onSaved }: Props) {
  const { t } = useLanguage();
  const [value, setValue] = useState(shown(tree.harvestedAmount));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setValue(shown(tree.harvestedAmount));
  }, [tree.harvestedAmount]);

  async function save() {
    const amount = Math.max(0, parseFloat(value) || 0);
    if (amount === tree.harvestedAmount) {
      setValue(shown(amount));
      return;
    }
    setSaving(true);
    setFailed(false);
    try {
      const updated: HarvestTree = { ...tree, harvestedAmount: amount };
      await updateHarvestTree(tree.id, updated);
      onSaved(updated);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <label className={failed ? 'picked-amount failed' : 'picked-amount'} title={failed ? t('farm.saveError') : label}>
      <input
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        value={value}
        disabled={disabled || saving}
        placeholder={label}
        aria-label={label}
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
