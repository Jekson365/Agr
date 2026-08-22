import { NavLink, useLocation } from 'react-router-dom';

import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { isNavItemVisible, type NavItem } from '@/config/nav-items';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';

/** Whether the page currently open lives somewhere inside this group. */
function containsPath(item: NavItem, pathname: string): boolean {
  return (item.children ?? []).some(
    (child) => pathname === child.to || pathname.startsWith(`${child.to}/`) || containsPath(child, pathname)
  );
}

export function navLinkClass({ isActive }: { isActive: boolean }): string {
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
export function SidebarNavItem({ item, groupKey, collapsed, onToggle }: NavItemProps) {
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

