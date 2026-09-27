import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { CurrencyProvider } from '@/contexts/currency-context';
import { SocialApp } from '@/social/social-app';
import '@/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CurrencyProvider>
      <SocialApp />
    </CurrencyProvider>
  </StrictMode>
);
