import { Fragment } from 'react';

import wineBottleIcon from '@/assets/icons/wine-bottle.svg';
import { backOut, easeOut, enter, mix, wave } from '@/promo/motion';
import { WN_STEPS } from '@/promo/winery/wn-copy';
import { WnStage } from '@/promo/winery/wn-stage';
import { BEAT, STEP_AT, stepIndex } from '@/promo/winery/wn-timeline';
import { ArrowIcon } from '@/social/post-frame';

function stepLook(time: number, index: number) {
  const current = stepIndex(time);
  const next = STEP_AT[index + 1] ?? Infinity;
  const dim = index === 0 ? 0 : enter(time, STEP_AT[0], 0.3) * (1 - enter(time, STEP_AT[index], 0.3));
  const ring = enter(time, STEP_AT[index], 0.45, backOut) * (1 - enter(time, next, 0.3));
  return { done: index < current, active: index === current, dim, ring };
}

function Stepper({ time }: { time: number }) {
  return (
    <div className="wn-steps">
      {WN_STEPS.map((step, index) => {
        const appear = enter(time, BEAT.tiles + index * 0.1, 0.5, backOut);
        const look = stepLook(time, index);
        return (
          <Fragment key={step.title}>
            {index > 0 && (
              <span
                className={stepIndex(time) >= index ? 'wn-arrow is-on' : 'wn-arrow'}
                style={{ opacity: enter(time, BEAT.tiles + index * 0.1, 0.4) }}
              >
                <ArrowIcon />
              </span>
            )}
            <div
              className={look.active ? 'wn-step is-active' : 'wn-step'}
              style={{
                opacity: Math.min(1, appear * 1.5) * (1 - 0.55 * look.dim),
                transform: `scale(${mix(0.5, 1, appear) * (1 + 0.06 * look.ring)})`,
              }}
            >
              <span className="wn-tile" style={{ boxShadow: `0 0 0 ${4 * look.ring}px var(--color-green)` }}>
                <img src={step.icon} alt="" />
                <b>{look.done ? '✓' : index + 1}</b>
              </span>
              <strong className="wn-step-title">{step.title}</strong>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function WineryVisual({ time }: { time: number }) {
  const rise = enter(time, BEAT.card, 0.75, easeOut);
  const sticker = enter(time, BEAT.sticker, 0.6, backOut);

  return (
    <div className="social-visual">
      <div
        className="social-card wn-card"
        style={{
          opacity: Math.min(1, rise * 1.4),
          transform: `translateY(${mix(120, 0, rise)}px) rotate(${mix(-4, 0, rise)}deg)`,
        }}
      >
        <Stepper time={time} />
        <WnStage time={time} />
      </div>
      {time >= BEAT.sticker && (
        <img
          className="social-sticker"
          src={wineBottleIcon}
          alt=""
          style={{
            opacity: Math.min(1, sticker * 1.5),
            transform: `translateY(${wave(time, 3.2, 8)}px) rotate(${8 + wave(time, 4, 3)}deg) scale(${mix(0.4, 1, sticker)})`,
          }}
        />
      )}
    </div>
  );
}
