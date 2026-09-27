import { createContext, useContext } from 'react';

export const ClockContext = createContext(0);

export function useClock(): number {
  return useContext(ClockContext);
}
