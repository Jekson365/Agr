import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'farm.fontScale';

/** Multipliers applied to the browser's default root font size (16px by default). */
const SCALES = [0.875, 1, 1.125, 1.25] as const;

export type FontScale = (typeof SCALES)[number];

type FontSizeContextValue = {
  scale: FontScale;
  canIncrease: boolean;
  canDecrease: boolean;
  increase: () => void;
  decrease: () => void;
};

const FontSizeContext = createContext<FontSizeContextValue | undefined>(undefined);

function initialScale(): FontScale {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return (SCALES as readonly number[]).includes(stored) ? (stored as FontScale) : 1;
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState<FontScale>(initialScale);

  // Font sizes across the app are in rem, so scaling the root font size scales all text.
  // A percentage (rather than px) keeps respecting the browser's own font-size setting.
  useEffect(() => {
    document.documentElement.style.fontSize = scale === 1 ? '' : `${scale * 100}%`;
    localStorage.setItem(STORAGE_KEY, String(scale));
  }, [scale]);

  const value = useMemo<FontSizeContextValue>(() => {
    const index = SCALES.indexOf(scale);
    return {
      scale,
      canIncrease: index < SCALES.length - 1,
      canDecrease: index > 0,
      increase: () => setScale((prev) => SCALES[Math.min(SCALES.indexOf(prev) + 1, SCALES.length - 1)]),
      decrease: () => setScale((prev) => SCALES[Math.max(SCALES.indexOf(prev) - 1, 0)]),
    };
  }, [scale]);

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
}

export function useFontSize() {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
}
