import { Navigate, Outlet } from 'react-router-dom';

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

  if (!loaded) {
    return null;
  }

  // A failed settings request reads every name as off. Denying on that would turn one bad response
  // into a tenant locked out of their own farm, so an unanswered question lets the page through —
  // the sidebar still stops offering the link, and the next successful fetch settles it.
  if (loadError) {
    return <Outlet />;
  }

  return isOn(name) ? <Outlet /> : <Navigate to="/404" replace />;
}
