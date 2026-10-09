import coinIcon from '@/assets/coin.png';
import grapeIcon from '@/assets/goods/grape.png';
import bottleIcon from '@/assets/icons/bottle-small.svg';
import { backOut, easeIn, easeOut, enter, mix, wave } from '@/promo/motion';
import { WN_FIGURES } from '@/promo/winery/wn-copy';
import { Lari } from '@/promo/winery/wn-money';
import { WnReport } from '@/promo/winery/wn-report';
import { STEP_AT } from '@/promo/winery/wn-timeline';
import '@/promo/winery/wn-stage.css';

const GRAPE_X = [62, 154, 246, 338, 430, 522];
const BOTTLE_X = Array.from({ length: 12 }, (_, index) => 44 + index * 45);
const SOLD_FROM = 7;

function Figure({ time, index }: { time: number; index: number }) {
  const figure = WN_FIGURES[index];
  const shown = enter(time, STEP_AT[index] + 0.18, 0.35, easeOut);
  const gone = enter(time, STEP_AT[index + 1], 0.18, easeIn);
  if (shown <= 0 || gone >= 1) return null;
  const value = figure.value * enter(time, STEP_AT[index] + 0.25, 0.9, easeOut);

  return (
    <div
      className="wn-figure"
      style={{ opacity: shown * (1 - gone), transform: `translateY(${mix(26, 0, shown) - 20 * gone}px)` }}
    >
      <strong>
        {figure.unit ? (
          `${Math.round(value)} ${figure.unit}`
        ) : (
          <>
            +<Lari value={value} />
          </>
        )}
      </strong>
      <span className="wn-figure-label">{figure.label}</span>
    </div>
  );
}

function Grapes({ time }: { time: number }) {
  return (
    <>
      {GRAPE_X.map((x, index) => {
        const drop = enter(time, STEP_AT[0] + 0.15 + index * 0.09, 0.55, backOut);
        const out = enter(time, STEP_AT[1] + index * 0.03, 0.3, easeIn);
        if (drop <= 0 || out >= 1) return null;
        return (
          <img
            key={x}
            className="wn-grape"
            src={grapeIcon}
            alt=""
            style={{
              left: x,
              opacity: Math.min(1, drop * 1.6) * (1 - out),
              transform: `translate(-50%, ${mix(-110, 0, drop)}px) scale(${1 - out})`,
            }}
          />
        );
      })}
    </>
  );
}

function Bottles({ time }: { time: number }) {
  return (
    <>
      {BOTTLE_X.map((x, index) => {
        const pop = enter(time, STEP_AT[1] + 0.2 + index * 0.05, 0.45, backOut);
        const sold = index >= SOLD_FROM ? enter(time, STEP_AT[2] + 0.15 + (BOTTLE_X.length - 1 - index) * 0.07, 0.55, easeIn) : 0;
        if (pop <= 0 || sold >= 1) return null;
        return (
          <img
            key={x}
            className="wn-bottle"
            src={bottleIcon}
            alt=""
            style={{
              left: x,
              opacity: Math.min(1, pop * 1.6) * (1 - sold),
              transform: `translate(calc(-50% + ${260 * sold}px), ${mix(46, 0, Math.min(1, pop))}px) scale(${mix(0.5, 1, pop)})`,
            }}
          />
        );
      })}
    </>
  );
}

function Coin({ time }: { time: number }) {
  const pop = enter(time, STEP_AT[2] + 0.8, 0.5, backOut);
  if (pop <= 0) return null;

  return (
    <img
      className="wn-coin"
      src={coinIcon}
      alt=""
      style={{ opacity: Math.min(1, pop * 1.6), transform: `translateY(${wave(time, 1.6, 5)}px) scale(${mix(0.3, 1, pop)})` }}
    />
  );
}

export function WnStage({ time }: { time: number }) {
  const shelf = 1 - enter(time, STEP_AT[3], 0.25, easeOut);

  return (
    <div className="wn-stage">
      {shelf > 0 && (
        <div className="wn-shelf" style={{ opacity: shelf }}>
          {WN_FIGURES.map((_, index) => (
            <Figure key={index} time={time} index={index} />
          ))}
          <Grapes time={time} />
          <Bottles time={time} />
          <Coin time={time} />
        </div>
      )}
      <WnReport time={time} />
    </div>
  );
}
