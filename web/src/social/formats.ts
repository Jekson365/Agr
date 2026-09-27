export type SocialFormat = 'portrait' | 'square';

export const SOCIAL_FORMATS: Record<SocialFormat, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  square: { width: 1080, height: 1080 },
};
