import chickenIcon from '@/assets/animals/chicken.png';
import cowIcon from '@/assets/animals/cow.png';
import roosterIcon from '@/assets/animals/rooster.png';
import sheepIcon from '@/assets/animals/sheep.png';
import potatoIcon from '@/assets/goods/potato.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import farmIcon from '@/assets/icons/farm.png';
import financesIcon from '@/assets/icons/finances.png';
import harvestIcon from '@/assets/icons/harvest.png';
import reportIcon from '@/assets/icons/report.png';
import balanceIcon from '@/assets/properties/balance.png';
import landIcon from '@/assets/properties/land.png';
import { backOut, easeIn, enter, mix, wave } from '@/promo/motion';
import { screenEnd, screenStart, WINDOW_BOX } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

type Sticker = { src: string; size: number; tilt: number };
type Spot = { x: number; y: number };
type Anchors = { topRight: Spot; bottomLeft: Spot };

const DESKTOP_ANCHORS: Anchors = {
  topRight: { x: WINDOW_BOX.x + WINDOW_BOX.width - 30, y: WINDOW_BOX.y + 6 },
  bottomLeft: { x: WINDOW_BOX.x + 10, y: WINDOW_BOX.y + WINDOW_BOX.height - 36 },
};

const GROUPS: [Sticker, Sticker][] = [
  [
    { src: farmIcon, size: 210, tilt: 8 },
    { src: landIcon, size: 230, tilt: -8 },
  ],
  [
    { src: harvestIcon, size: 220, tilt: 10 },
    { src: tomatoIcon, size: 190, tilt: -12 },
  ],
  [
    { src: balanceIcon, size: 220, tilt: 8 },
    { src: potatoIcon, size: 200, tilt: -12 },
  ],
  [
    { src: cowIcon, size: 200, tilt: 9 },
    { src: sheepIcon, size: 190, tilt: -10 },
  ],
  [
    { src: roosterIcon, size: 210, tilt: 8 },
    { src: chickenIcon, size: 190, tilt: -10 },
  ],
  [
    { src: financesIcon, size: 220, tilt: 8 },
    { src: reportIcon, size: 200, tilt: -8 },
  ],
];

function StickerImage({
  sticker,
  anchor,
  start,
  end,
  phase,
  zoom,
}: {
  sticker: Sticker;
  anchor: Spot;
  start: number;
  end: number;
  phase: number;
  zoom: number;
}) {
  const time = useClock();
  const pop = enter(time, start, 0.6, backOut);
  const out = enter(time, end - 0.06, 0.24, easeIn);
  const shown = time >= start && out < 1;
  const scale = pop * (1 - out);
  const bob = wave(time, 2.8, 9, phase);
  const turn = sticker.tilt + wave(time, 3.4, 3, phase) + mix(-30, 0, pop);
  const size = sticker.size * zoom;

  return (
    <img
      className="promo-sticker"
      src={sticker.src}
      alt=""
      style={{
        visibility: shown ? 'visible' : 'hidden',
        width: size,
        height: size,
        left: anchor.x - size / 2,
        top: anchor.y - size / 2,
        transform: `translateY(${bob}px) rotate(${turn}deg) scale(${scale})`,
      }}
    />
  );
}

export function Stickers({ anchors = DESKTOP_ANCHORS, zoom = 1 }: { anchors?: Anchors; zoom?: number }) {
  return (
    <>
      {GROUPS.map(([first, second], index) => {
        const start = screenStart(index) + (index === 0 ? 0.75 : 0.22);
        const end = screenEnd(index);
        return [
          <StickerImage key={`${index}-a`} sticker={first} anchor={anchors.topRight} start={start} end={end} phase={index * 0.7} zoom={zoom} />,
          <StickerImage
            key={`${index}-b`}
            sticker={second}
            anchor={anchors.bottomLeft}
            start={start + 0.12}
            end={end}
            phase={index * 0.7 + 1.3}
            zoom={zoom}
          />,
        ];
      })}
    </>
  );
}
