import farmlandTall from '@/assets/farmland-tall.png';
import type { IntroLayout } from '@/promo/intro-scene';

export const MOBILE_WIDTH = 1080;
export const MOBILE_HEIGHT = 1920;

export const PHONE_BOX = { x: 130, y: 600, width: 820, height: 1180 };
export const BEZEL = 14;
export const TAB_HEIGHT = 128;
export const TAB_ICON_CENTER = 44;
export const TAB_WIDTH = (PHONE_BOX.width - BEZEL * 2) / 6;

export const MOBILE_INTRO: IntroLayout = {
  badge: { x: 540, y: 790 },
  image: farmlandTall,
  portal: 1420,
  copyTop: 945,
};

export const PHONE_STICKERS = {
  topRight: { x: PHONE_BOX.x + PHONE_BOX.width - 4, y: PHONE_BOX.y + 16 },
  bottomLeft: { x: PHONE_BOX.x + 10, y: PHONE_BOX.y + PHONE_BOX.height - 330 },
};

export function tabCenter(index: number) {
  return {
    x: PHONE_BOX.x + BEZEL + TAB_WIDTH * (index + 0.5),
    y: PHONE_BOX.y + PHONE_BOX.height - BEZEL - TAB_HEIGHT + TAB_ICON_CENTER,
  };
}
