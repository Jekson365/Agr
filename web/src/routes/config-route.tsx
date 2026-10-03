import { Navigate, Outlet } from 'react-router-dom';

import { ModuleLocked } from '@/components/farm/module-locked';
import { lockedModule } from '@/config/farm-modules';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';

/**
 * Gates a group of routes behind a tenant setting. Hiding the sidebar entry only stops the link
 * being offered — the path is still typed, bookmarked and linked to — so the areas a setting
 * covers sit behind this as well.
 *
 * Renders nothing until the settings have arrived: before then every name reads as off, and
 * redirecting on that would bounce a tenant off a page their setting actually allows.
 */
export function ConfigRoute({ name }: { name: string }) {
  const { loaded, loadError, isOn } = useConfiguration();
  const { user } = useAuth();

  if (!loaded) {
    return null;
  }

  const locked = lockedModule(user, name);
  const content = locked ? <ModuleLocked module={locked} /> : <Outlet />;

  // A failed settings request reads every name as off. Denying on that would turn one bad response
  // into a tenant locked out of their own farm, so an unanswered question lets the page through —
  // the sidebar still stops offering the link, and the next successful fetch settles it.
  if (loadError) {
    return content;
  }

  return isOn(name) ? content : <Navigate to="/404" replace />;
}
