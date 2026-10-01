import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { CurrencyProvider } from '@/contexts/currency-context';
import { LANGUAGE } from '@/promo/locale';
import { SocialApp } from '@/social/social-app';
import '@/index.css';

document.documentElement.lang = LANGUAGE;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <SocialApp />
    </CurrencyProvider>
  </StrictMode>
);
