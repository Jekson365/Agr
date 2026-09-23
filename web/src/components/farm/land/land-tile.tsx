import { Link } from 'react-router-dom';

import landPlaceholder from '@/assets/properties/land.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ChevronRightIcon, FlaskIcon, LeafIcon, LocationIcon, SquareIcon } from '@/components/icons/misc-icons';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Farm } from '@/types/farm';
import './land-tile.css';

/** One kind of thing a piece of land holds, as the card shows it: the kind's artwork over how much
 *  of it there is. The name is carried as the tooltip only — the picture is the label. */
export type LandContent = { key: string; icon: string; label: string; count: number };

/** How many kinds a card shows before the rest are gathered into a "+N". Enough to say what a
 *  piece of land is for; past that the card would be a list rather than a card. */
const MAX_TILE_CONTENTS = 6;

type Props = {
  farm: Farm;
  contents: LandContent[];
  soilTo?: string;
  onSoil?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
};

export function LandTile({ farm, contents, soilTo, onSoil, onEdit, onDelete, onRestore }: Props) {
  const { t } = useLanguage();

  const shown = contents.slice(0, MAX_TILE_CONTENTS);
  const hidden = contents.length - shown.length;

  const soilInner = (
    <>
      <FlaskIcon width={16} height={16} />
      {t('soil.title')}
    </>
  );

  /* Removed land keeps its card and turns disabled — see Farm.isRemoved. It is still readable,
     and still opens, so the plots and herds recorded on it can be reached. */
  return (
    <div className={farm.isRemoved ? 'land-tile is-removed' : 'land-tile'}>
      {/* Photo first: it is what tells one piece of land from another at a glance, and the name
          underneath reads as its caption. */}
      <Link to={`/farm/land/${farm.id}`} className="land-tile-media">
        <img
          src={farm.imagePath ? resolveAssetUrl(farm.imagePath) : landPlaceholder}
          alt=""
          className="land-tile-image"
        />
        <span className="land-tile-badge">
          <LeafIcon width={26} height={26} />
        </span>
      </Link>

      {/* Sits over the photo rather than in the text, so the body below stays a clean column.
          Removed land takes no edits, so its menu offers putting it back instead. */}
      <div className="land-tile-menu">
        {farm.isRemoved ? (
          <CardMenu extra={{ labelKey: 'farm.restoreLand', onSelect: onRestore }} />
        ) : (
          <CardMenu onEdit={onEdit} onDelete={onDelete} />
        )}
      </div>

      <div className="land-tile-body">
        <h2 className="land-tile-title">
          {farm.name}
          {farm.isRemoved && <span className="removed-chip">{t('balance.removed')}</span>}
        </h2>

        <div className="land-tile-meta">
          <div className="land-tile-row">
            <SquareIcon width={16} height={16} />
            <span>
              {t('farm.area')} {farm.area} {t('farm.areaUnit')}
            </span>
          </div>
          <div className="land-tile-row">
            <LocationIcon width={16} height={16} />
            <span>{farm.location}</span>
          </div>
        </div>

        {/* What the land is actually for, in its own artwork: the crops planted on it and the
            herds kept there. The kind's name is the tooltip — on the card the picture says it,
            with how many under it. Land holding neither skips the row. */}
        {contents.length > 0 && (
          <div className="land-tile-contents">
            {shown.map((entry) => (
              <span key={entry.key} className="land-tile-chip" title={`${entry.label}: ${entry.count}`}>
                <img src={entry.icon} alt={entry.label} />
                <b>{entry.count}</b>
              </span>
            ))}
            {hidden > 0 && <span className="land-tile-chip more">+{hidden}</span>}
          </div>
        )}

        <span className="land-tile-divider" />

        {/* Opening a land shows its plots, mirroring the mobile app. The soil button beside it
            goes to one plot's investigations: straight there when the land carries a single plot,
            through a picker when it carries several, and absent when it carries none. */}
        <div className="land-tile-actions">
          <Link to={`/farm/land/${farm.id}`} className="land-tile-details">
            {t('common.details')}
            <ChevronRightIcon width={16} height={16} />
          </Link>

          {soilTo ? (
            <Link to={soilTo} className="land-tile-soil" title={t('soil.title')}>
              {soilInner}
            </Link>
          ) : onSoil ? (
            <button type="button" className="land-tile-soil" onClick={onSoil} title={t('soil.title')}>
              {soilInner}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
