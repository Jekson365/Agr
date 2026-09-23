import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseItem } from '@/types/purchase';
import './purchase-goods.css';
import { purchaseTargetIcon } from './purchase-icons';
import { purchaseItemLabel, purchaseQuantity } from './purchase-item-label';
import { PURCHASE_KIND_LABEL_KEY } from './purchase-targets';

const STACK_LIMIT = 4;

export function PurchaseGoodsStack({ items }: { items: PurchaseItem[] }) {
  const seen = new Map<string, string>();
  for (const item of items) {
    const key = `${item.kind}:${item.name}`;
    if (!seen.has(key)) seen.set(key, purchaseTargetIcon(item.kind, item.name));
  }

  const icons = [...seen.entries()];
  const extra = icons.length - STACK_LIMIT;

  return (
    <span className="purchase-stack">
      {icons.slice(0, STACK_LIMIT).map(([key, icon]) => (
        <img key={key} className="purchase-stack-icon" src={icon} alt="" />
      ))}
      {extra > 0 && <span className="purchase-stack-more">+{extra}</span>}
    </span>
  );
}

export function PurchaseGoodsPanel({ items, total }: { items: PurchaseItem[]; total: number }) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <div className="purchase-goods">
      <div className="purchase-goods-head">
        <span>{t('purchase.item')}</span>
        <span className="purchase-goods-num">{t('purchase.quantity')}</span>
        <span className="purchase-goods-num">{t('purchase.price')}</span>
      </div>

      {items.map((item) => (
        <div key={item.id} className="purchase-goods-row">
          <span className="purchase-goods-target">
            <img className="purchase-goods-icon" src={purchaseTargetIcon(item.kind, item.name)} alt="" />
            <span className="purchase-goods-text">
              <span className="purchase-goods-name">{purchaseItemLabel(item.kind, item.name, t)}</span>
              <span className="purchase-goods-kind">{t(PURCHASE_KIND_LABEL_KEY[item.kind])}</span>
            </span>
          </span>
          <span className="purchase-goods-num">
            {purchaseQuantity(item.quantity)}
            {item.quantity > 0 && (
              <span className="purchase-goods-unit">× {formatPrice(item.price / item.quantity)}</span>
            )}
          </span>
          <span className="purchase-goods-num purchase-goods-price">{formatPrice(item.price)}</span>
        </div>
      ))}

      <div className="purchase-goods-foot">
        <span>{t('purchase.total')}</span>
        <span className="purchase-goods-num purchase-goods-price">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
