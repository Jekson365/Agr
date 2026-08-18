import { resolveAssetUrl } from '@/services/api-client';

/**
 * Artwork for the kinds a user added, keyed by catalog and kind name.
 *
 * The built-in kinds are drawn from images bundled with the app, and `stockKindImage(name)` and
 * its siblings are pure name → asset lookups used in ~50 places. A user-added kind has no bundled
 * image to key to; its artwork lives on the server and only the catalog knows the path. Rather
 * than thread the catalog through fifty call sites, it is registered here once — the resolvers
 * consult this between the built-in map and the generic fallback, so a user-added kind is drawn
 * exactly like a built-in wherever a built-in would be.
 *
 * Module state rather than a context because the resolvers are plain functions that pickers,
 * config modules and pure derivations all call outside React. {@link KindIconLoader} owns filling
 * it and re-renders the tree once it has, so nothing paints a fallback and then keeps it.
 *
 * Matching is case-insensitive: a kind is referenced by name from `Stock.type` and friends, and
 * nothing normalises the casing on the way in.
 */

export type KindCatalogName = 'stock' | 'fruit' | 'livestock';

const icons: Record<KindCatalogName, Map<string, string>> = {
  stock: new Map(),
  fruit: new Map(),
  livestock: new Map(),
};

/** Replaces one catalog's icons wholesale — a catalog is always loaded in full, and a kind
 *  deleted elsewhere has to drop out rather than linger. */
export function registerKindIcons(catalog: KindCatalogName, kinds: { name: string; imagePath: string }[]): void {
  const next = new Map<string, string>();
  for (const kind of kinds) {
    // Built-ins carry no path; leaving them out is what lets the bundled artwork win for them.
    if (kind.imagePath) next.set(kind.name.trim().toLowerCase(), resolveAssetUrl(kind.imagePath));
  }
  icons[catalog] = next;
}

/** One kind's own artwork, or undefined when it has none — a built-in, or a name nothing matches. */
export function customKindIcon(catalog: KindCatalogName, name: string): string | undefined {
  return icons[catalog].get(name.trim().toLowerCase());
}
