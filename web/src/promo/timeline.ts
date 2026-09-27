export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;
export const DURATION = 15;

export const WINDOW_BOX = { x: 770, y: 140, width: 1060, height: 800 };
export const CHROME_HEIGHT = 54;
export const SIDEBAR_WIDTH = 260;
export const NAV_TOP = 112;
export const NAV_STEP = 62;
export const NAV_HEIGHT = 54;
export const NAV_CHILDREN = [2, 4];
export const NAV_CHILD_INDENT = 28;

export const INTRO_END = 2.25;
export const STAGE_IN = 1.72;
export const FIRST_BEAT = 4;
export const BEAT = 1.8;
export const SCREEN_COUNT = 6;
export const LAST_SCREEN = SCREEN_COUNT - 1;
export const OUTRO_START = 13;

export function clickTime(index: number): number {
  return FIRST_BEAT + BEAT * (index - 1);
}

export function screenStart(index: number): number {
  return index === 0 ? STAGE_IN : clickTime(index);
}

export function screenEnd(index: number): number {
  return index + 1 < SCREEN_COUNT ? clickTime(index + 1) : OUTRO_START;
}

export function windowFloat(time: number): number {
  return Math.sin((time / 5) * Math.PI * 2) * 5;
}

export function navIndent(index: number): number {
  return NAV_CHILDREN.includes(index) ? NAV_CHILD_INDENT : 0;
}

export function navCenter(index: number) {
  return {
    x: WINDOW_BOX.x + 96 + navIndent(index),
    y: WINDOW_BOX.y + CHROME_HEIGHT + NAV_TOP + index * NAV_STEP + NAV_HEIGHT / 2,
  };
}
