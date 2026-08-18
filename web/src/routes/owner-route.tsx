import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';

/**
 * Gates a route to one account by email. Hiding the sidebar entry only stops the link being
 * offered — the path is still typed, bookmarked and linked to — so the page sits behind this too,
 * the way {@link ConfigRoute} backs the configuration-gated areas.
 *
 * **This is not a permission.** It decides what the browser will render, and a browser is the
 * user's. The API behind the type catalogs is open to every signed-in user, exactly as it was
 * before this page existed — the pickers in the stock, fruit and livestock forms already add and
 * remove kinds. Making it a real restriction would mean checking on the server.
 *
 * Renders nothing while the session is being read: before then there is no email to compare, and
 * redirecting on that would bounce the owner off their own page on every refresh.
 */
export function OwnerRoute({ email }: { email: string }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Case-insensitive: the server lower-cases an email on write, but a session read back from
  // storage is whatever was stored when it was written.
  return user?.email?.toLowerCase() === email.toLowerCase() ? <Outlet /> : <Navigate to="/404" replace />;
}
