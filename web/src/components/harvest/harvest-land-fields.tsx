import { useEffect, useState } from 'react';

import { cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { Harvest } from '@/types/harvest';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  open: boolean;
  editingHarvest: Harvest | null;
  onChange: (farmId: number | null, plotId: number | null) => void;
};

function plotLabel(plot: LandPlot, t: (key: string) => string): string {
  return `${cropLabel(plot.crop, t)} · ${plot.area} ${t('farm.areaUnit')}`;
}

export function HarvestLandFields({ open, editingHarvest, onChange }: Props) {
  const { t } = useLanguage();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [farmId, setFarmId] = useState<number | null>(null);

  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [plotsLoading, setPlotsLoading] = useState(false);
  const [plotId, setPlotId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingHarvest]);

  useEffect(() => {
    onChange(farmId, plotId);
  }, [farmId, plotId, onChange]);

  async function initialize() {
    setFarmsLoading(true);
    try {
      // Removed land takes no new harvests, and only stays on the list for the one already
      // recorded on it — dropping it there would move that harvest to another piece on the next
      // save.
      const all = await getFarms();
      const farmList = all.filter((farm) => !farm.isRemoved || farm.id === editingHarvest?.farmId);
      setFarms(farmList);

      const preset = editingHarvest?.farmId ?? farmList[0]?.id ?? null;
      setFarmId(preset);
      await loadPlots(preset, editingHarvest?.landPlotId ?? null);
    } catch {
      setFarms([]);
      setFarmId(null);
      setPlots([]);
      setPlotId(null);
    } finally {
      setFarmsLoading(false);
    }
  }

  async function loadPlots(farm: number | null, presetPlotId?: number | null) {
    if (farm == null) {
      setPlots([]);
      setPlotId(null);
      return;
    }

    setPlotsLoading(true);
    try {
      const plotList = await getLandPlots(farm);
      setPlots(plotList);
      setPlotId(presetPlotId != null && plotList.some((p) => p.id === presetPlotId) ? presetPlotId : null);
    } catch {
      setPlots([]);
      setPlotId(null);
    } finally {
      setPlotsLoading(false);
    }
  }

  return (
    <>
      <div className="field">
        <label>{t('harvest.landLabel')}</label>
        {farmsLoading ? (
          <span className="limit-hint">…</span>
        ) : farms.length === 0 ? (
          <p className="limit-hint">{t('harvest.noFarms')}</p>
        ) : (
          <select
            value={farmId ?? ''}
            onChange={(e) => {
              setFarmId(Number(e.target.value));
              loadPlots(Number(e.target.value));
            }}
          >
            {farms.map((farm) => (
              <option key={farm.id} value={farm.id}>
                {farm.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {farms.length > 0 && (
        <div className="field">
          <label>{t('harvest.plotLabel')}</label>
          {plotsLoading ? (
            <span className="limit-hint">…</span>
          ) : plots.length === 0 ? (
            <p className="limit-hint">{t('harvest.noPlots')}</p>
          ) : (
            <select value={plotId ?? ''} onChange={(e) => setPlotId(e.target.value ? Number(e.target.value) : null)}>
              <option value="">{t('harvest.wholeLand')}</option>
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
