import '@/components/farm/farm-crud.css';
import { Modal } from '@/components/ui/modal';
import { cropImage, cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import type { LandPlot } from '@/types/land-plot';

type Props = {
  open: boolean;
  plots: LandPlot[];
  onClose: () => void;
  onSelect: (plotId: number) => void;
};

export function LandSoilPlotModal({ open, plots, onClose, onSelect }: Props) {
  const { t } = useLanguage();

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{t('soil.pickPlot')}</h2>
      <p className="modal-body-text">{t('soil.pickPlotHint')}</p>

      <div className="list-card-grid">
        {plots.map((plot) => (
          <div key={plot.id} className="list-card">
            <button type="button" className="list-card-body" onClick={() => onSelect(plot.id)}>
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
          </div>
        ))}
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </Modal>
  );
}
