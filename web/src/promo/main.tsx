import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { CurrencyProvider } from '@/contexts/currency-context';
import { PromoApp } from '@/promo/promo-app';
import '@/index.css';
import '@/promo/promo.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <PromoApp />
    </CurrencyProvider>
  </StrictMode>
);
