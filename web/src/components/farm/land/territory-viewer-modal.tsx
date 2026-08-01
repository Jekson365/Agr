import { TerritoryMap } from '@/components/farm/land/territory-map';
import { Modal } from '@/components/ui/modal';
import { formatArea, territoryAreaHectares, type OtherTerritory, type TerritoryPoint } from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';

import './territory-viewer.css';

type Props = {
  open: boolean;
  /** The land being looked at. */
  title: string;
  points: TerritoryPoint[];
  /** Neighbouring land, drawn around it. */
  others?: OtherTerritory[];
  onClose: () => void;
};

/**
 * A territory at full size, for looking rather than editing — the whole screen given over to the
 * outline and the neighbourhood around it. Reshaping still belongs to the editor the land's own
 * form opens.
 */
export function TerritoryViewerModal({ open, title, points, others, onClose }: Props) {
  const { t } = useLanguage();
  const area = territoryAreaHectares(points);

  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="territory-viewer">
        <div className="territory-viewer-header">
          <div className="territory-viewer-heading">
            <h2 className="territory-viewer-title">{title}</h2>
            <p className="territory-viewer-subtitle">{t('landTerritory.label')}</p>
          </div>

          {area > 0 && (
            <span className="territory-viewer-area">
              ≈ {formatArea(area)} {t('farm.areaUnit')}
            </span>
          )}

          <button type="button" className="btn btn-secondary territory-viewer-close" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>

        <div className="territory-viewer-map">
          {/* Filling the screen, so the wheel here can only mean zoom. */}
          <TerritoryMap points={points} others={others} label={title} wheelZoom />
        </div>
      </div>
    </Modal>
  );
}
