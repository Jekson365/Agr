import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import landPlaceholder from '@/assets/properties/land.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LandPlotFormModal } from '@/components/farm/land/land-plot-form-modal';
import { cropImage, cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getFarm } from '@/services/farm-service';
import { deleteLandPlot, getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import './land-detail-page.css';

export function LandDetailPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const farmId = Number(idParam);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; crop: string } | null>(null);

  useEffect(() => {
    if (!farmId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getFarm(farmId), getLandPlots(farmId)]);
      setFarm(item);
      setPlots(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingPlot(null);
    setFormOpen(true);
  }

  function openEdit(plot: LandPlot) {
    setEditingPlot(plot);
    setFormOpen(true);
  }

  function handleSaved(plot: LandPlot, isNew: boolean) {
    setPlots((prev) => (isNew ? [...prev, plot] : prev.map((p) => (p.id === plot.id ? plot : p))));
  }

  async function confirmDeletePlot() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteLandPlot(id);
      setPlots((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  // How much of the land is accounted for by plots — the farm's own area is the ceiling.
  const allocatedArea = plots.reduce((sum, plot) => sum + plot.area, 0);
  const remainingArea = farm ? farm.area - allocatedArea : 0;

  return (
    <div>
      <Link to="/farm/land" className="back-link">
        ← {t('farm.land')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{farm?.name ?? t('farm.land')}</h1>
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('landPlot.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('landPlot.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          {farm && (
            <div className="land-detail-header">
              <img
                src={farm.imagePath ? resolveAssetUrl(farm.imagePath) : landPlaceholder}
                alt=""
                className="land-detail-image"
              />
              <div className="land-detail-facts">
                <div className="list-card-subtitle">
                  {t('farm.area')} {farm.area} {t('farm.areaUnit')}
                </div>
                <div className="list-card-subtitle">
                  {t('farm.location')}: {farm.location}
                </div>
                <div className="land-detail-allocation">
                  <div className="land-detail-allocation-row">
                    <span>{t('landPlot.allocated')}</span>
                    <span>
                      {round2(allocatedArea)} / {farm.area} {t('farm.areaUnit')}
                    </span>
                  </div>
                  <div className="land-detail-allocation-track">
                    <div
                      className={allocatedArea > farm.area ? 'land-detail-allocation-fill over' : 'land-detail-allocation-fill'}
                      style={{ width: `${farm.area > 0 ? Math.min(100, (allocatedArea / farm.area) * 100) : 0}%` }}
                    />
                  </div>
                  <span className={remainingArea < 0 ? 'limit-hint land-detail-over' : 'limit-hint'}>
                    {remainingArea < 0
                      ? t('landPlot.overAllocated', { area: round2(Math.abs(remainingArea)), unit: t('farm.areaUnit') })
                      : t('landPlot.remaining', { area: round2(remainingArea), unit: t('farm.areaUnit') })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {plots.length === 0 ? (
            <p className="empty-state">{t('landPlot.empty')}</p>
          ) : (
            <div className="list-card-grid">
              {plots.map((plot) => (
                <div key={plot.id} className="list-card">
                  <button type="button" className="list-card-body" onClick={() => openEdit(plot)}>
                    <span className="list-card-icon-wrap">
                      <img src={cropImage(plot.crop)} alt="" />
                    </span>
                    <span className="list-card-info">
                      <span className="list-card-title">{cropLabel(plot.crop, t)}</span>
                      <br />
                      <span className="list-card-subtitle">
                        {plot.area} {t('farm.areaUnit')}
                      </span>
                    </span>
                  </button>
                  <CardMenu
                    onEdit={() => openEdit(plot)}
                    onDelete={() => setConfirmDelete({ id: plot.id, crop: cropLabel(plot.crop, t) })}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <LandPlotFormModal
        open={formOpen}
        farmId={farmId}
        editingPlot={editingPlot}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.crop ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeletePlot}
      />
    </div>
  );
}

/** Trims areas to 2 decimals without printing trailing zeros (2.5, not 2.50). */
function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}
