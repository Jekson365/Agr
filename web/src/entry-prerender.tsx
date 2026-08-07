import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import { AuthProvider } from '@/contexts/auth-context';
import { ConfigurationProvider } from '@/contexts/configuration-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { FontSizeProvider } from '@/contexts/font-size-context';
import { LanguageProvider } from '@/contexts/language-context';
import { ThemeProvider } from '@/contexts/theme-context';
import { LandingPage } from '@/pages/landing-page';

/**
 * Renders the marketing page to a string at build time. `scripts/prerender.mjs` drops the result
 * into dist/index.html, so what the server hands a crawler is the page rather than an empty div.
 *
 * The landing page is imported directly rather than through App: App's route table pulls in the
 * map page, and Leaflet reaches for `window` the moment it is imported, which in Node is a crash.
 * Routing the one URL we care about through MemoryRouter avoids the whole tree. The providers are
 * main.tsx's, in main.tsx's order — anything the page reads from context has to be here, and any
 * difference in the order would be a difference in the markup.
 *
 * Everything these providers do to the browser — reading storage, setting `data-theme`, measuring
 * scroll — happens in effects, which don't run here. What they read *during* render is the three
 * `useState` initialisers, and the prerender script stubs the globals those reach for.
 */
export function render(): string {
  return renderToString(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ConfigurationProvider>
                <CurrencyProvider>
                  <LandingPage />
                </CurrencyProvider>
              </ConfigurationProvider>
            </AuthProvider>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
