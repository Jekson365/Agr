import { Outlet } from 'react-router-dom';

import { FontSizeToggle } from '@/components/ui/font-size-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { PageHelp } from '@/components/ui/page-help';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Sidebar } from '@/components/layout/sidebar';
import './app-shell.css';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-shell-body">
        <header className="app-topbar">
          <FontSizeToggle />
          <ThemeToggle />
          <LanguageToggle />
        </header>
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <PageHelp />
    </div>
  );
}
