import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Currency = 'GEL' | 'USD';

// Listing prices are entered and stored in GEL; this is a fixed display-only conversion rate
// (no live FX rate service is wired up), used only to render the USD-equivalent price.
const GEL_PER_USD = 2.7;

const CURRENCY_SYMBOL: Record<Currency, string> = { GEL: '₾', USD: '$' };

type CurrencyContextValue = {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  toggleCurrency: () => void;
  formatPrice: (amountGel: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('GEL');

  const value = useMemo<CurrencyContextValue>(() => {
    return {
      currency,
      setCurrency,
      toggleCurrency: () => setCurrency((prev) => (prev === 'GEL' ? 'USD' : 'GEL')),
      formatPrice: (amountGel) => {
        const amount = currency === 'USD' ? amountGel / GEL_PER_USD : amountGel;
        const rounded = Math.round(amount * 100) / 100;
        return `${CURRENCY_SYMBOL[currency]}${rounded}`;
      },
    };
  }, [currency]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
