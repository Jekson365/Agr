import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { STOCK_KIND_CATALOG } from '@/components/farm/stock/stock-form/stock-kind-catalog';
import { StockSeedFields } from '@/components/farm/stock/stock-form/stock-seed-fields';
import { UnitChips } from '@/components/farm/stock/stock-form/unit-chips';
import { STOCK_UNIT_OPTIONS } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { StockDraft } from '../onboarding-draft';

type Props = {
  value: StockDraft;
  onChange: (next: StockDraft) => void;
};

export function StockStep({ value, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-step">
      <div className="onboarding-fields">
        <KindCatalogField
          open
          catalog={STOCK_KIND_CATALOG}
          value={value.type}
          onChange={(type) => onChange({ ...value, type })}
          preset={null}
          labelText={t('farm.type')}
          addPlaceholder={t('farm.newStockTypePlaceholder')}
          variant="dropdown"
          size="large"
          allowAdd={false}
        />

        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder={t('farm.stockNamePlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.amount')}</label>
          <input
            type="number"
            step="0.01"
            value={value.amount}
            onChange={(e) => onChange({ ...value, amount: e.target.value })}
            placeholder={t('farm.amountPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('farm.unit')}</label>
          <UnitChips
            options={STOCK_UNIT_OPTIONS}
            selected={value.unit}
            onSelect={(unit) => onChange({ ...value, unit })}
          />
        </div>

        <div className="onboarding-field-wide">
          <StockSeedFields
            amount={value.seedAmount}
            onAmountChange={(seedAmount) => onChange({ ...value, seedAmount })}
            unit={value.seedUnit}
            onUnitChange={(seedUnit) => onChange({ ...value, seedUnit })}
            stockType={value.type}
          />
        </div>
      </div>
    </div>
  );
}
