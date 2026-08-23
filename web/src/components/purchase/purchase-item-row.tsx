import { useMemo } from 'react';

import { KindDropdown } from '@/components/farm/kind-dropdown';
import type { KindOption } from '@/components/farm/kind-picker';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseItemKind } from '@/types/purchase';
import { findTarget, targetKey, type PurchaseLine } from './purchase-lines';
import { PURCHASE_KIND_ICON } from './purchase-icons';
import { PURCHASE_KIND_LABEL_KEY, type PurchaseTargets } from './purchase-targets';

type Props = {
  line: PurchaseLine;
  kinds: PurchaseItemKind[];
  targets: PurchaseTargets;
  onChange: (line: PurchaseLine) => void;
  onRemove: () => void;
  removable: boolean;
};

export function PurchaseItemRow({ line, kinds, targets, onChange, onRemove, removable }: Props) {
  const { t } = useLanguage();

  const options = targets[line.kind];
  const selected = findTarget(targets, line);

  const kindOptions: KindOption[] = useMemo(
    () => kinds.map((kind) => ({ value: kind, label: t(PURCHASE_KIND_LABEL_KEY[kind]), icon: PURCHASE_KIND_ICON[kind] })),
    [kinds, t]
  );

  const targetOptions: KindOption[] = useMemo(
    () =>
      options.map((target) => ({
        value: targetKey(target),
        label: `${target.label} (${target.unitLabel})`,
        icon: target.icon,
      })),
    [options]
  );

  function changeKind(kind: PurchaseItemKind) {
    const first = targets[kind][0];
    onChange({ ...line, kind, targetKey: first ? targetKey(first) : '' });
  }

  return (
    <div className="purchase-line">
      <div className="field">
        <label>{t('purchase.kind')}</label>
        <KindDropdown
          options={kindOptions}
          selected={line.kind}
          onSelect={(value) => changeKind(value as PurchaseItemKind)}
        />
      </div>

      <div className="field">
        <label>{t('purchase.item')}</label>
        {options.length === 0 ? (
          <span className="limit-hint field-fixed-value">{t('purchase.noTargets')}</span>
        ) : (
          <KindDropdown
            options={targetOptions}
            selected={line.targetKey}
            onSelect={(value) => onChange({ ...line, targetKey: value })}
          />
        )}
      </div>

      <div className="field purchase-line-narrow">
        <label>{t('purchase.quantity')}</label>
        <input
          value={line.quantity}
          onChange={(e) => onChange({ ...line, quantity: e.target.value })}
          placeholder={t('farm.amountPlaceholder')}
          inputMode="decimal"
        />
        {selected && <span className="limit-hint">{selected.unitLabel}</span>}
      </div>

      <div className="field purchase-line-narrow">
        <label>{t('purchase.price')}</label>
        <input
          value={line.price}
          onChange={(e) => onChange({ ...line, price: e.target.value })}
          placeholder="0"
          inputMode="decimal"
        />
      </div>

      <button
        type="button"
        className="purchase-line-remove"
        onClick={onRemove}
        disabled={!removable}
        aria-label={t('common.delete')}
      >
        ✕
      </button>
    </div>
  );
}
