import { Outlet } from 'react-router-dom';

import { NeighboursButton } from '@/components/neighbours/neighbours-button';
import { FontSizeToggle } from '@/components/ui/font-size-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { MarketplaceButton } from '@/components/ui/marketplace-button';
import { PageHelp } from '@/components/ui/page-help';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { KindIconLoader } from '@/components/layout/kind-icon-loader';
import { Sidebar } from '@/components/layout/sidebar';
import './app-shell.css';

/* Wrapped rather than mounted beside the routes: the sidebar and every page below draw kind
   artwork, and the loader has to have filled the registry before any of them paint. */
export function AppShell() {
  return (
    <KindIconLoader>
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell-body">
        <header className="app-topbar">
          <FontSizeToggle />
          <ThemeToggle />
          <LanguageToggle />
          <MarketplaceButton />
          <NeighboursButton />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <PageHelp />
    </div>
    </KindIconLoader>
  );
}
