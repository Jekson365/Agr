import { SEED_UNIT_OPTIONS } from '@/config/seed-kinds';
import { stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { SeedUnit } from '@/types/seed';
import type { StockType } from '@/types/stock';
import { UnitChips } from './unit-chips';

type Props = {
  amount: string;
  onAmountChange: (amount: string) => void;
  unit: SeedUnit;
  onUnitChange: (unit: SeedUnit) => void;
  /** The crop the seed belongs to, named in the hint. */
  stockType: StockType;
};

/**
 * How much seed to create alongside a new stock. A crop arrives as both the seed you sow and the
 * produce bucket it ends up in, so the two are made together — only on create, since editing a
 * stock shouldn't mint new seed rows.
 */
export function StockSeedFields({ amount, onAmountChange, unit, onUnitChange, stockType }: Props) {
  const { t } = useLanguage();

  return (
    <div className="field">
      <label>{t('seed.title')}</label>

      <div className="stock-seed-fields">
        <div className="field">
          <label>{t('seed.amountLabel')}</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          <UnitChips options={SEED_UNIT_OPTIONS} selected={unit} onSelect={onUnitChange} />
        </div>

        <span className="limit-hint">{t('seed.addWithStockHint', { crop: stockTypeLabel(stockType, t) })}</span>
      </div>
    </div>
  );
}
