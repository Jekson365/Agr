import { round2 } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import type { WineBatchSummary } from '@/types/wine';

type Props = {
  batch: WineBatchSummary;
  onEditLiters: () => void;
};

export function WineBatchKpis({ batch, onEditLiters }: Props) {
  const { t } = useLanguage();
  const ratio = batch.grapeKg > 0 ? round2(batch.producedLiters / batch.grapeKg) : null;

  const tiles = [
    { key: 'grapes', label: t('wine.grapesTitle'), value: `${round2(batch.grapeKg)} ${t('farm.unitKg')}` },
    { key: 'produced', label: t('wine.produced'), value: `${round2(batch.producedLiters)} ${t('wine.unitLiter')}` },
    { key: 'cellar', label: t('wine.inCellar'), value: `${round2(batch.liters)} ${t('wine.unitLiter')}` },
    { key: 'bottles', label: t('wine.unitBottle'), value: String(batch.bottles) },
    { key: 'yield', label: t('wine.yield'), value: ratio != null ? t('wine.yieldValue', { ratio }) : '—' },
  ];

  return (
    <div className="wine-kpis">
      {tiles.map((tile) => (
        <div key={tile.key} className="wine-kpi">
          <span className="wine-kpi-label">{tile.label}</span>
          <strong className="wine-kpi-value">{tile.value}</strong>
          {tile.key === 'produced' && !batch.isDeleted && (
            <button type="button" className="wine-kpi-edit" onClick={onEditLiters}>
              {t('wine.litersEdit')}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
