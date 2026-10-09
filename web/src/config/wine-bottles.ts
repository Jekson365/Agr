import largeIcon from '@/assets/icons/bottle-large.svg';
import mediumIcon from '@/assets/icons/bottle-medium.svg';
import smallIcon from '@/assets/icons/bottle-small.svg';

export type BottleType = 'small' | 'medium' | 'large';

export const BOTTLE_TYPES: BottleType[] = ['small', 'medium', 'large'];

export const BOTTLE_TYPE_INFO: Record<BottleType, { icon: string }> = {
  small: { icon: smallIcon },
  medium: { icon: mediumIcon },
  large: { icon: largeIcon },
};

export function bottleTypeOf(size: number): BottleType {
  if (size < 5) return 'small';
  if (size < 10) return 'medium';
  return 'large';
}

export function bottleIconFor(size: number): string {
  return BOTTLE_TYPE_INFO[bottleTypeOf(size)].icon;
}
