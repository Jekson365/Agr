import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';

import { AppWindow } from '@/promo/app-window';
import { Captions } from '@/promo/captions';
import { Cursor } from '@/promo/cursor';
import { FinancesScenes } from '@/promo/finances/fin-scenes';
import { FIN_DURATION } from '@/promo/finances/fin-timeline';
import { HarvestCycleScenes } from '@/promo/harvest/cycle-scenes';
import { CYCLE_DURATION } from '@/promo/harvest/cycle-timeline';
import { IntroScene } from '@/promo/intro-scene';
import { MOBILE_HEIGHT, MOBILE_WIDTH } from '@/promo/mobile/layout';
import { MobileScenes } from '@/promo/mobile/mobile-scenes';
import { OutroScene } from '@/promo/outro-scene';
import { PacketsScenes } from '@/promo/packets/pk-scenes';
import { PACKETS_DURATION } from '@/promo/packets/pk-timeline';
import { ReportsScenes } from '@/promo/reports/rpt-scenes';
import { REPORTS_DURATION } from '@/promo/reports/rpt-timeline';
import { StageBackground } from '@/promo/stage-background';
import { Stickers } from '@/promo/stickers';
import { DURATION, STAGE_HEIGHT, STAGE_WIDTH } from '@/promo/timeline';
import { ClockContext } from '@/promo/use-clock';
import { SOCIAL_FORMATS } from '@/social/formats';

type Mode = { kind: 'live' } | { kind: 'render' } | { kind: 'still'; time: number };

const FORMAT = new URLSearchParams(window.location.search).get('format');
const MOBILE = FORMAT === 'mobile';
const VIDEO = new URLSearchParams(window.location.search).get('video');
const POST = VIDEO === 'finances';
const VIDEO_LENGTH: Record<string, number> = {
  harvest: CYCLE_DURATION,
  reports: REPORTS_DURATION,
  packets: PACKETS_DURATION,
  finances: FIN_DURATION,
};
const LENGTH = (VIDEO && VIDEO_LENGTH[VIDEO]) || DURATION;
const STAGE = POST
  ? SOCIAL_FORMATS[FORMAT === 'square' ? 'square' : 'portrait']
  : MOBILE
    ? { width: MOBILE_WIDTH, height: MOBILE_HEIGHT }
    : { width: STAGE_WIDTH, height: STAGE_HEIGHT };
const STAGE_CLASS = POST ? `promo-stage is-post${FORMAT === 'square' ? ' is-square' : ''}` : MOBILE ? 'promo-stage is-mobile' : 'promo-stage';

function readMode(): Mode {
  const params = new URLSearchParams(window.location.search);
  if (params.has('render')) return { kind: 'render' };
  const still = params.get('t');
  return still === null ? { kind: 'live' } : { kind: 'still', time: Number(still) };
}

function useStageScale(): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / STAGE.width, window.innerHeight / STAGE.height));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return scale;
}

function DesktopScenes() {
  return (
    <>
      <StageBackground />
      <Captions />
      <AppWindow />
      <Stickers />
      <Cursor />
      <OutroScene />
      <IntroScene />
    </>
  );
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
      Object.assign(window, { promoSeek, promoDuration: LENGTH });
      return;
    }

    const origin = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      setTime(((now - origin) / 1000) % LENGTH);
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [mode]);

  return (
    <div className="promo-viewport">
      <div
        className={STAGE_CLASS}
        style={{ transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <ClockContext.Provider value={time}>
          {VIDEO === 'harvest' ? (
            <HarvestCycleScenes />
          ) : VIDEO === 'reports' ? (
            <ReportsScenes />
          ) : VIDEO === 'packets' ? (
            <PacketsScenes />
          ) : VIDEO === 'finances' ? (
            <FinancesScenes />
          ) : MOBILE ? (
            <MobileScenes />
          ) : (
            <DesktopScenes />
          )}
        </ClockContext.Provider>
      </div>
    </div>
  );
}
