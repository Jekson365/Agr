import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import coinIcon from '@/assets/coin.png';
import logo from '@/assets/logo.png';
import { ChevronDownIcon, LogoutIcon, ProfileIcon } from '@/components/icons/nav-icons';
import { isNavItemVisible, QUICK_ACCESS_ITEMS, type NavItem } from '@/config/nav-items';
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

/** Whether the page currently open lives somewhere inside this group. */
function containsPath(item: NavItem, pathname: string): boolean {
  return (item.children ?? []).some(
    (child) => pathname === child.to || pathname.startsWith(`${child.to}/`) || containsPath(child, pathname)
  );
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

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return isActive ? 'sidebar-link active' : 'sidebar-link';
}

type NavItemProps = {
  item: NavItem;
  /** Its position in the tree. Two groups can share a `to`, so the path to it is the identity. */
  groupKey: string;
  collapsed: Set<string>;
  onToggle: (key: string) => void;
};

/** One nav entry, recursing into its children. A group starts expanded and stays however the user
 * last left it — see {@link initialCollapsed}. */
function SidebarNavItem({ item, groupKey, collapsed, onToggle }: NavItemProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOn } = useConfiguration();
  const { pathname } = useLocation();

  const children = item.children?.filter((child) => isNavItemVisible(child, user, isOn));
  const hasChildren = !!children?.length;
  const isCollapsed = hasChildren && collapsed.has(groupKey);
  const label = t(item.labelKey);
  const subnavId = `subnav:${groupKey}`;

  const caret = (
    <ChevronDownIcon
      className={isCollapsed ? 'sidebar-caret-icon collapsed' : 'sidebar-caret-icon'}
      aria-hidden="true"
    />
  );

  // A collapsed group hides the link that would be lit, so the header says "you're in here".
  const marksActive = isCollapsed && containsPath(item, pathname);

  return (
    <div className={marksActive ? 'sidebar-group has-active-child' : 'sidebar-group'}>
      <div className="sidebar-group-header">
        {item.expandOnly && hasChildren ? (
          // Its destination is covered by one of the children, so the header only names the
          // group — which leaves the row free to be the group's own toggle.
          <button
            type="button"
            className="sidebar-link sidebar-link-toggle"
            aria-expanded={!isCollapsed}
            aria-controls={subnavId}
            onClick={() => onToggle(groupKey)}
          >
            <img src={item.icon} className="sidebar-link-icon" alt="" />
            <span>{label}</span>
            {caret}
          </button>
        ) : (
          <>
            <NavLink to={item.to} end={item.end} className={navLinkClass}>
              <img src={item.icon} className="sidebar-link-icon" alt="" />
              <span>{label}</span>
            </NavLink>

            {/* Separate from the link, so reaching a group's own page and folding it away stay
                two different clicks. */}
            {hasChildren && (
              <button
                type="button"
                className="sidebar-caret"
                aria-expanded={!isCollapsed}
                aria-controls={subnavId}
                aria-label={t(isCollapsed ? 'nav.expandSection' : 'nav.collapseSection', { name: label })}
                onClick={() => onToggle(groupKey)}
              >
                {caret}
              </button>
            )}
          </>
        )}
      </div>

      {hasChildren && !isCollapsed && (
        <div className="sidebar-subnav" id={subnavId}>
          {children.map((child) => (
            <SidebarNavItem
              key={child.to}
              item={child}
              groupKey={`${groupKey}>${child.to}`}
              collapsed={collapsed}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
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

      <nav className="sidebar-nav">
        {QUICK_ACCESS_ITEMS.filter((item) => isNavItemVisible(item, user, isOn)).map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            groupKey={item.to}
            collapsed={collapsed}
            onToggle={toggleGroup}
          />
        ))}
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
