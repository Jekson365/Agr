import { useEffect, useState, type ReactNode } from 'react';

import { registerKindIcons } from '@/config/kind-icons';
import { useAuth } from '@/contexts/auth-context';
import { getFruitKinds } from '@/services/fruit-kind-service';
import { getLivestockKinds } from '@/services/livestock-kind-service';
import { getStockKinds } from '@/services/stock-kind-service';

/**
 * Fills the kind-icon registry once per sign-in, so the artwork a user gave their own kinds is
 * available to `stockKindImage` and its siblings — plain functions called from ~50 places, most of
 * them outside React and none of them able to subscribe to anything.
 *
 * It holds the tree back until the three catalogs have settled, the way {@link ProtectedRoute}
 * holds it back while the session is read. That is deliberate: passing `children` through means
 * they are a stable element, so a later state change here would not re-render them — anything that
 * painted the generic fallback first would keep it until something else happened to re-render it.
 * Three small catalog requests are the cheaper end of that trade.
 *
 * Nothing is held back before sign-in: the catalogs live in the signed-in user's own tenant
 * database, so there is nothing to fetch and nothing to wait for.
 */
export function KindIconLoader({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  /** The user whose catalogs are in the registry, so switching accounts refetches rather than
   *  showing the previous farm's artwork. */
  const [loadedFor, setLoadedFor] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    (async () => {
      // Settled, not all: one catalog failing shouldn't cost the other two their artwork, and
      // none of them failing should strand the app on a blank page.
      const [stock, fruit, livestock] = await Promise.allSettled([
        getStockKinds(),
        getFruitKinds(),
        getLivestockKinds(),
      ]);
      if (cancelled) return;

      if (stock.status === 'fulfilled') registerKindIcons('stock', stock.value);
      if (fruit.status === 'fulfilled') registerKindIcons('fruit', fruit.value);
      if (livestock.status === 'fulfilled') registerKindIcons('livestock', livestock.value);
      setLoadedFor(user.id);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (user && loadedFor !== user.id) {
    return null;
  }

  return <>{children}</>;
}
