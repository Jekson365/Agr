import farmland from '@/assets/farmland-tall.png';
import { MAP_SAMPLE_CROPS } from '@/config/landing';
import { copy, tr } from '@/promo/locale';
import { SOCIAL_FORMATS, type SocialFormat } from '@/social/formats';
import '@/social/visuals/cards.css';
import '@/social/visuals/map-cards.css';

type Owner = 'own' | 'neighbour' | 'other';

type Field = {
  owner: Owner;
  selected?: boolean;
  initial: string;
  name: string;
  points: string;
  pin: { x: number; y: number };
};

const OWN = { owner: 'own' as Owner, initial: 'T', name: copy.map.you };
const NEIGHBOUR = { owner: 'neighbour' as Owner, initial: 'N', name: copy.landing.map.farmerNeighbour };
const SELECTED = { owner: 'other' as Owner, selected: true, initial: 'L', name: copy.landing.map.farmerSelected };

const FIELDS: Record<SocialFormat, Field[]> = {
  portrait: [
    { ...NEIGHBOUR, points: '28,588 302,562 334,628 48,652', pin: { x: 182, y: 606 } },
    { ...OWN, points: '22,690 426,666 482,774 38,816', pin: { x: 330, y: 736 } },
    { ...SELECTED, points: '592,712 1052,700 1064,812 612,828', pin: { x: 824, y: 764 } },
  ],
  square: [
    { ...OWN, points: '18,600 440,588 480,690 30,714', pin: { x: 334, y: 646 } },
    { ...NEIGHBOUR, points: '24,494 330,480 352,556 40,570', pin: { x: 188, y: 516 } },
    { ...SELECTED, points: '560,604 1062,592 1070,666 578,676', pin: { x: 824, y: 634 } },
  ],
};

export function MapBackdrop({ format }: { format: SocialFormat }) {
  const { width, height } = SOCIAL_FORMATS[format];
  const fields = FIELDS[format];

  return (
    <>
      <img className="map-backdrop-image" src={farmland} alt="" />
      <span className="map-backdrop-scrim" />
      <svg className="map-backdrop-fields" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        {fields.map((field) => (
          <polygon
            key={field.initial}
            points={field.points}
            className={field.selected ? `map-field is-${field.owner} is-selected` : `map-field is-${field.owner}`}
          />
        ))}
      </svg>
      {fields.map((field) => (
        <span key={field.initial} className="map-pin-wrap" style={{ left: field.pin.x, top: field.pin.y }}>
          <span className={`map-pin is-${field.owner}`}>{field.initial}</span>
          <span className="map-pin-name">{field.name}</span>
        </span>
      ))}
    </>
  );
}

export function MapCard() {
  return (
    <div className="social-card map-card">
      <div className="map-card-head">
        <span className="map-card-avatar">L</span>
        <span className="map-card-who">
          <strong>{copy.landing.map.farmerSelected}</strong>
          <span>
            {copy.landing.market.tomato.location} · {copy.neighbours.away.replace('{distance}', '1.2 km')}
          </span>
        </span>
        <span className="map-card-add">{copy.neighbours.add}</span>
      </div>
      <div className="map-card-crops">
        {MAP_SAMPLE_CROPS.map((crop) => (
          <span key={crop.id} className="map-card-crop">
            <img src={crop.icon} alt="" />
            <strong>{tr(crop.nameKey)}</strong>
            <span>
              {crop.area} {copy.farm.areaUnit}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
