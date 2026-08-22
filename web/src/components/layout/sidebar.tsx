import { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';

import coinIcon from '@/assets/coin.png';
import marketIcon from '@/assets/icons/market.png';
import logo from '@/assets/logo.png';
import { LogoutIcon, ProfileIcon } from '@/components/icons/nav-icons';
import { navLinkClass, SidebarNavItem } from '@/components/layout/sidebar-nav-item';
import { isNavItemVisible, QUICK_ACCESS_ITEMS } from '@/config/nav-items';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import './sidebar.css';

const COLLAPSED_KEY = 'farm.sidebar.collapsed';

/**
 * The groups the user has collapsed, keyed by their position in the tree. Collapsed rather than
 * expanded is what's stored, so a group added later still starts open and an empty/missing value
 * means the whole tree is visible — the behaviour before any of this existed.
 *
 * Read synchronously during the first render so a refresh paints the nav the way it was left,
 * with no flash of an expanded tree collapsing itself a moment later.
 */
function initialCollapsed(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(COLLAPSED_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : []);
  } catch {
    // A half-written or hand-edited value shouldn't cost the user their navigation.
    return new Set();
  }
}

function initialsFor(name: string | undefined): string {
  return (name ?? '')
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Sidebar() {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const { isOn } = useConfiguration();

  const [collapsed, setCollapsed] = useState<Set<string>>(initialCollapsed);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]));
  }, [collapsed]);

  const toggleGroup = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      // delete() reports whether it removed anything, which is exactly "was it collapsed".
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logo} className="sidebar-brand-icon" alt="" />
        <span className="sidebar-brand-title">{t('auth.appName')}</span>
      </div>

      {/* Who you are and what you've earned, at the top where both are the first thing seen. */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.imagePath ? (
            <img src={resolveAssetUrl(user.imagePath)} alt="" />
          ) : (
            <span>{initialsFor(user?.name)}</span>
          )}
        </div>
        <div className="sidebar-user-identity">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className="sidebar-coins" title={t('coins.title')}>
            <img src={coinIcon} className="sidebar-coin-icon" alt="" />
            <span className="sidebar-coin-count">{user?.coins ?? 0}</span>
          </span>
        </div>
      </div>

      {/* An account registered from the marketplace has no farm behind it, so the farm tree would
          be a list of dead ends. The marketplace is its whole app, and the link is not gated on a
          tenant setting it has no database to hold. */}
      <nav className="sidebar-nav">
        {user?.hasManagementAccess === false ? (
          <NavLink to="/market" className={navLinkClass}>
            <img src={marketIcon} className="sidebar-link-icon" alt="" />
            <span>{t('dashboard.marketplace')}</span>
          </NavLink>
        ) : (
          QUICK_ACCESS_ITEMS.filter((item) => isNavItemVisible(item, user, isOn)).map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              groupKey={item.to}
              collapsed={collapsed}
              onToggle={toggleGroup}
            />
          ))
        )}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/profile" className={navLinkClass}>
          <ProfileIcon width={24} height={24} />
          <span>{t('profile.title')}</span>
        </NavLink>

        <button type="button" className="btn btn-secondary sidebar-signout" onClick={signOut}>
          <LogoutIcon width={20} height={20} />
          <span>{t('profile.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
