import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from '@/contexts/auth-context'
import { ConfigurationProvider } from '@/contexts/configuration-context'
import { CurrencyProvider } from '@/contexts/currency-context'
import { FontSizeProvider } from '@/contexts/font-size-context'
import { LanguageProvider } from '@/contexts/language-context'
import { ThemeProvider } from '@/contexts/theme-context'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <FontSizeProvider>
          <LanguageProvider>
            <AuthProvider>
              {/* Inside AuthProvider: the settings live in the signed-in user's own database. */}
              <ConfigurationProvider>
                <CurrencyProvider>
                  <App />
                </CurrencyProvider>
              </ConfigurationProvider>
            </AuthProvider>
          </LanguageProvider>
        </FontSizeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
