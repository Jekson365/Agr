import { useLanguage } from '@/contexts/language-context';
import type { PurchaseItemKind } from '@/types/purchase';
import { findTarget, targetKey, type PurchaseLine } from './purchase-lines';
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

  function changeKind(kind: PurchaseItemKind) {
    const first = targets[kind][0];
    onChange({ ...line, kind, targetKey: first ? targetKey(first) : '' });
  }

  return (
    <div className="purchase-line">
      <div className="field">
        <label>{t('purchase.kind')}</label>
        <select value={line.kind} onChange={(e) => changeKind(e.target.value as PurchaseItemKind)}>
          {kinds.map((kind) => (
            <option key={kind} value={kind}>
              {t(PURCHASE_KIND_LABEL_KEY[kind])}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>{t('purchase.item')}</label>
        {options.length === 0 ? (
          <span className="limit-hint field-fixed-value">{t('purchase.noTargets')}</span>
        ) : (
          <select value={line.targetKey} onChange={(e) => onChange({ ...line, targetKey: e.target.value })}>
            {options.map((target) => (
              <option key={targetKey(target)} value={targetKey(target)}>
                {target.label} ({target.unitLabel})
              </option>
            ))}
          </select>
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
