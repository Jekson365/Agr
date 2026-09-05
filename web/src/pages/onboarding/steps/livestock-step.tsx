import { useEffect, useState } from 'react';

import { KindCatalogField } from '@/components/farm/kind-catalog-field';
import { LIVESTOCK_KIND_CATALOG } from '@/components/farm/livestock/livestock-kind-catalog';
import { MultiSelect } from '@/components/ui/multi-select';
import { PRODUCTION_TYPE_LABEL_KEY, RETIRED_PRODUCTION_TYPE_NAMES } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { getProductionTypes } from '@/services/production-type-service';
import type { ProductionType } from '@/types/production-type';
import type { LivestockDraft } from '../onboarding-draft';

type Props = {
  value: LivestockDraft;
  hasFarm: boolean;
  onChange: (next: LivestockDraft) => void;
};

export function LivestockStep({ value, hasFarm, onChange }: Props) {
  const { t } = useLanguage();

  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProductionTypes()
      .then((list) => {
        if (!cancelled) {
          setProductionTypes(list.filter((item) => !RETIRED_PRODUCTION_TYPE_NAMES.has(item.name)));
        }
      })
      .catch(() => {
        if (!cancelled) setProductionTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="onboarding-step">
      <div className="onboarding-fields">
        <div className="field">
          <label>{t('farm.name')}</label>
          <input
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder={t('farm.namePlaceholderLivestock')}
          />
        </div>

        <KindCatalogField
          open
          catalog={LIVESTOCK_KIND_CATALOG}
          value={value.type}
          onChange={(type) => onChange({ ...value, type })}
          preset={null}
          labelText={t('farm.type')}
          addPlaceholder={t('farm.newLivestockTypePlaceholder')}
          variant="dropdown"
          size="large"
          allowAdd={false}
        />

        <div className="field">
          <label>{t('farm.count')}</label>
          <input
            type="number"
            value={value.count}
            onChange={(e) => onChange({ ...value, count: e.target.value })}
            placeholder={t('farm.countPlaceholder')}
          />
        </div>

        <div className="field">
          <label>{t('production.producesLabel')}</label>
          {loadingTypes ? (
            <span className="limit-hint">…</span>
          ) : (
            <MultiSelect
              options={productionTypes.map((item) => ({
                value: String(item.id),
                label: t(PRODUCTION_TYPE_LABEL_KEY[item.name] ?? item.name),
              }))}
              selected={value.productionTypeIds.map(String)}
              onChange={(values) => onChange({ ...value, productionTypeIds: values.map(Number) })}
              placeholder={t('production.producesPlaceholder')}
              searchPlaceholder={t('production.producesSearchPlaceholder')}
              emptyText={t('production.producesEmpty')}
              size="large"
            />
          )}
        </div>

        {!hasFarm && <p className="limit-hint onboarding-field-wide">{t('farm.noFarmland')}</p>}
      </div>
    </div>
  );
}
