import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { AppWindow } from '@/promo/app-window';
import { Captions } from '@/promo/captions';
import { Cursor } from '@/promo/cursor';
import { IntroScene } from '@/promo/intro-scene';
import { OutroScene } from '@/promo/outro-scene';
import { StageBackground } from '@/promo/stage-background';
import { Stickers } from '@/promo/stickers';
import { DURATION, STAGE_HEIGHT, STAGE_WIDTH } from '@/promo/timeline';
import { ClockContext } from '@/promo/use-clock';

type Mode = { kind: 'live' } | { kind: 'render' } | { kind: 'still'; time: number };

function readMode(): Mode {
  const params = new URLSearchParams(window.location.search);
  if (params.has('render')) return { kind: 'render' };
  const still = params.get('t');
  return still === null ? { kind: 'live' } : { kind: 'still', time: Number(still) };
}

function useStageScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return scale;
}

export function PromoApp() {
  const [mode] = useState(readMode);
  const [time, setTime] = useState(mode.kind === 'still' ? mode.time : 0);
  const scale = useStageScale();

  useEffect(() => {
    if (mode.kind === 'still') return;

    if (mode.kind === 'render') {
      const promoSeek = (next: number) =>
        new Promise<void>((resolve) => {
          flushSync(() => setTime(next));
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
      Object.assign(window, { promoSeek, promoDuration: DURATION });
      return;
    }

    const origin = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      setTime(((now - origin) / 1000) % DURATION);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  return (
    <div className="promo-viewport">
      <div className="promo-stage" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <ClockContext.Provider value={time}>
          <StageBackground />
          <Captions />
          <AppWindow />
          <Stickers />
          <Cursor />
          <OutroScene />
          <IntroScene />
        </ClockContext.Provider>
      </div>
    </div>
  );
}
