import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { HarvestGradingSheet } from './harvest-grading-sheet';
import { HarvestGradingTabs } from './harvest-grading-tabs';
import { useHarvestGrading } from './use-harvest-grading';
import './harvest-grading.css';

type Props = {
  harvestId: number;
};

export function GradingSection({ harvestId }: Props) {
  const { t } = useLanguage();

  const grading = useHarvestGrading(harvestId);
  const { goods } = grading;

  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    if (goods.length === 0) return;
    if (activeKey != null && goods.some((good) => good.key === activeKey)) return;
    setActiveKey(goods[0].key);
  }, [goods, activeKey]);

  const active = goods.find((good) => good.key === activeKey) ?? null;

  if (grading.loading) return <div className="state-box">…</div>;

  if (grading.error) {
    return (
      <div className="state-box">
        <span>{t('harvestGrading.loadError')}</span>
        <button type="button" className="retry-button" onClick={grading.load}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  if (goods.length === 0) return <p className="hd-empty">{t('harvestGrading.empty')}</p>;

  return (
    <>
      {goods.length > 1 && (
        <HarvestGradingTabs goods={goods} activeKey={active?.key ?? ''} onSelect={setActiveKey} />
      )}

      {active && (
        <HarvestGradingSheet
          key={active.key}
          harvestId={harvestId}
          good={active}
          saved={grading.linesFor(active)}
          criteria={grading.criteriaFor(active)}
          onSaved={grading.applySaved}
        />
      )}
    </>
  );
}
