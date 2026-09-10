import { useEffect, useState } from 'react';

import { cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  open: boolean;
  farmId: string;
  landPlotId: string;
  onChange: (farmId: string, landPlotId: string) => void;
};

function isFree(plot: LandPlot): boolean {
  return plot.treeStockId == null && plot.stockId == null;
}

function plotLabel(plot: LandPlot, t: (key: string) => string): string {
  const crop = plot.crop.trim() ? `${cropLabel(plot.crop, t)} · ` : '';
  return `${crop}${plot.area} ${t('farm.areaUnit')}`;
}

export function TreeStockLandField({ open, farmId, landPlotId, onChange }: Props) {
  const { t } = useLanguage();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    getFarms()
      .then((all) => {
        if (!cancelled) setFarms(all.filter((farm) => !farm.isRemoved));
      })
      .catch(() => {
        if (!cancelled) setFarms([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!farmId) {
      setPlots([]);
      return;
    }
    let cancelled = false;
    getLandPlots(Number(farmId))
      .then((list) => {
        if (!cancelled) setPlots(list.filter(isFree));
      })
      .catch(() => {
        if (!cancelled) setPlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [farmId]);

  if (loading) {
    return (
      <div className="field">
        <label>{t('harvest.landLabel')}</label>
        <span className="limit-hint">…</span>
      </div>
    );
  }

  if (farms.length === 0) {
    return (
      <div className="field">
        <label>{t('harvest.landLabel')}</label>
        <p className="limit-hint">{t('harvest.noFarms')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="field">
        <label>{t('harvest.landLabel')}</label>
        <select value={farmId} onChange={(e) => onChange(e.target.value, '')}>
          <option value="">{t('treeStock.noLand')}</option>
          {farms.map((farm) => (
            <option key={farm.id} value={farm.id}>
              {farm.name}
            </option>
          ))}
        </select>
      </div>

      {farmId && (
        <div className="field">
          <label>{t('harvest.plotLabel')}</label>
          {plots.length === 0 ? (
            <p className="limit-hint">{t('treeStock.noFreePlots')}</p>
          ) : (
            <select value={landPlotId} onChange={(e) => onChange(farmId, e.target.value)}>
              <option value="">{t('treeStock.noLand')}</option>
              {plots.map((plot) => (
                <option key={plot.id} value={plot.id}>
                  {plotLabel(plot, t)}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  );
}
