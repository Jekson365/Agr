import { CycleCaptions } from '@/promo/harvest/cycle-captions';
import { CycleCursor } from '@/promo/harvest/cycle-cursor';
import { CycleStock } from '@/promo/harvest/cycle-stock';
import { CYCLE_OUTRO } from '@/promo/harvest/cycle-timeline';
import { CycleWindow } from '@/promo/harvest/cycle-window';
import { OutroScene } from '@/promo/outro-scene';
import { StageBackground } from '@/promo/stage-background';

export function HarvestCycleScenes() {
  return (
    <>
      <StageBackground />
      <CycleCaptions />
      <CycleWindow />
      <CycleStock />
      <CycleCursor />
      <OutroScene start={CYCLE_OUTRO} />
    </>
  );
}
