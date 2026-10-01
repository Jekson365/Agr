import { Captions } from '@/promo/captions';
import { IntroScene } from '@/promo/intro-scene';
import { MOBILE_INTRO, PHONE_STICKERS } from '@/promo/mobile/layout';
import { PhoneFrame } from '@/promo/mobile/phone-frame';
import { TouchPointer } from '@/promo/mobile/touch-pointer';
import { OutroScene } from '@/promo/outro-scene';
import { StageBackground } from '@/promo/stage-background';
import { Stickers } from '@/promo/stickers';
import '@/promo/mobile/mobile.css';

export function MobileScenes() {
  return (
    <>
      <StageBackground />
      <Captions variant="mobile" />
      <PhoneFrame />
      <Stickers anchors={PHONE_STICKERS} zoom={0.82} />
      <TouchPointer />
      <OutroScene />
      <IntroScene layout={MOBILE_INTRO} />
    </>
  );
}
