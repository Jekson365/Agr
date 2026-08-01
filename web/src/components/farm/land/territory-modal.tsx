import { useEffect, useRef, useState } from 'react';

import { TerritoryMap } from '@/components/farm/land/territory-map';
import { Modal } from '@/components/ui/modal';
import {
  formatArea,
  territoryAreaHectares,
  toOtherTerritories,
  toOwnTerritories,
  type OtherTerritory,
  type TerritoryPoint,
} from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';
import { getFarms } from '@/services/farm-service';
import { getNeighbourTerritories } from '@/services/neighbour-service';

import './territory-modal.css';

type Props = {
  open: boolean;
  /** The territory as it stands — the outline the editor opens on. */
  points: TerritoryPoint[];
  /** The land being marked out, when it is one that already exists: it is on the map as the
   *  outline being drawn, so it must not also be drawn behind itself. */
  exceptFarmId?: number | null;
  /** Where to open the map when nothing is marked yet. */
  fallbackCenter?: TerritoryPoint | null;
  onClose: () => void;
  onSave: (points: TerritoryPoint[]) => void;
};

/**
 * The full-screen editor for a land's territory. Edits are kept as a draft here and only handed
 * back on save, so closing the editor leaves the land's outline as it was.
 */
export function TerritoryModal({ open, points, exceptFarmId, fallbackCenter, onClose, onSave }: Props) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<TerritoryPoint[]>(points);

  // Read through a ref so the draft is seeded once per opening. Watching `points` itself would
  // throw away the edit in progress every time the caller re-rendered its own copy of the outline.
  const pointsRef = useRef(points);
  useEffect(() => {
    pointsRef.current = points;
  });

  useEffect(() => {
    if (open) setDraft(pointsRef.current);
  }, [open]);

  // Every other outline already on the ground — the user's own other fields first, then the land
  // around them — so a boundary can be drawn up against what is really there rather than guessed
  // at. Fetched when the editor opens; a failure just leaves the map without them.
  const [others, setOthers] = useState<OtherTerritory[]>([]);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([getFarms(), getNeighbourTerritories()])
      .then(([farms, otherFarmers]) => {
        if (!cancelled) setOthers([...toOwnTerritories(farms, exceptFarmId), ...toOtherTerritories(otherFarmers)]);
      })
      .catch(() => {
        // Context, not content — the editor still does its job without it.
      });
    return () => {
      cancelled = true;
    };
  }, [open, exceptFarmId]);

  const area = territoryAreaHectares(draft);

  return (
    <Modal open={open} onClose={onClose} size="full">
      <div className="territory-editor">
        <div className="territory-editor-toolbar">
          <div className="territory-editor-heading">
            <h2 className="territory-editor-title">{t('landTerritory.title')}</h2>
            <p className="territory-editor-hint">{t('landTerritory.hint')}</p>
          </div>

          <div className="territory-editor-readout">
            <span className="territory-editor-corners">
              {t('landTerritory.corners', { count: draft.length })}
            </span>
            {draft.length >= 3 && (
              <span className="territory-editor-area">
                ≈ {formatArea(area)} {t('farm.areaUnit')}
              </span>
            )}
          </div>

          <div className="territory-editor-actions">
            <button
              type="button"
              className="territory-editor-btn"
              onClick={() => setDraft((current) => current.slice(0, -1))}
              disabled={draft.length === 0}
            >
              {t('landTerritory.undo')}
            </button>
            <button
              type="button"
              className="territory-editor-btn"
              onClick={() => setDraft([])}
              disabled={draft.length === 0}
            >
              {t('landTerritory.clear')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn" onClick={() => onSave(draft)}>
              {t('common.save')}
            </button>
          </div>
        </div>

        <div className="territory-editor-map">
          <TerritoryMap points={draft} onChange={setDraft} others={others} fallbackCenter={fallbackCenter} />
        </div>
      </div>
    </Modal>
  );
}
