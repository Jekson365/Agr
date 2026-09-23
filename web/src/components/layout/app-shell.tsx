import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { ChevronRightIcon } from '@/components/icons/misc-icons';
import { NeighboursButton } from '@/components/neighbours/neighbours-button';
import { ExportButton } from '@/components/ui/export-button';
import { FontSizeToggle } from '@/components/ui/font-size-toggle';
import { GuideButton } from '@/components/ui/guide-button';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { MarketplaceButton } from '@/components/ui/marketplace-button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { KindIconLoader } from '@/components/layout/kind-icon-loader';
import { Sidebar } from '@/components/layout/sidebar';
import { useLanguage } from '@/contexts/language-context';
import './app-shell.css';

const HIDE_DELAY = 260;
const LOCK_KEY = 'farm.sidebar.locked';

function initialLocked(): boolean {
  try {
    return localStorage.getItem(LOCK_KEY) === '1';
  } catch {
    return false;
  }
}

/* Wrapped rather than mounted beside the routes: the sidebar and every page below draw kind
   artwork, and the loader has to have filled the registry before any of them paint. */
export function AppShell() {
  const { t } = useLanguage();
  const { pathname } = useLocation();

  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [locked, setLocked] = useState(initialLocked);
  const hideTimer = useRef<number | null>(null);

  const open = hovering || pinned || locked;

  useEffect(() => {
    try {
      localStorage.setItem(LOCK_KEY, locked ? '1' : '0');
    } catch {
      return;
    }
  }, [locked]);

  useEffect(() => {
    setHovering(false);
    setPinned(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !locked) {
        setHovering(false);
        setPinned(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [locked]);

  function cancelHide() {
    if (hideTimer.current != null) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer.current = window.setTimeout(() => setHovering(false), HIDE_DELAY);
  }

  return (
    <KindIconLoader>
      <div className={locked ? 'app-shell locked' : 'app-shell'}>
        <div
          className="app-shell-edge"
          onMouseEnter={() => {
            cancelHide();
            setHovering(true);
          }}
        />

        {!locked && (
          <button
            type="button"
            className="app-sidebar-handle"
            aria-label={t('nav.openMenu')}
            onClick={() => setPinned(true)}
          >
            <ChevronRightIcon width={14} height={14} />
          </button>
        )}

        {pinned && !locked && <div className="app-sidebar-scrim" onClick={() => setPinned(false)} />}

        <aside
          className={open ? 'app-sidebar open' : 'app-sidebar'}
          onMouseEnter={cancelHide}
          onMouseLeave={() => {
            if (!pinned && !locked) scheduleHide();
          }}
        >
          <Sidebar locked={locked} onToggleLock={() => setLocked((prev) => !prev)} />
        </aside>

        <div className="app-shell-body">
          <header className="app-topbar">
            <GuideButton />
            <ExportButton />
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
      </div>
    </KindIconLoader>
  );
}
