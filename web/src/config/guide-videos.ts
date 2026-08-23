/**
 * The recorded walkthroughs, keyed by what they show.
 *
 * Globbed rather than imported one by one: a video that has not been recorded yet is simply absent
 * from the map, and the button for it hides itself. A static import of a missing file would fail
 * the build instead, which is a poor trade for artwork that arrives later than the code.
 */
const FILES = import.meta.glob('../assets/guide/*.mp4', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function find(name: string): string | null {
  const match = Object.keys(FILES).find((path) => path.toLowerCase().endsWith(`/${name.toLowerCase()}`));
  return match ? FILES[match] : null;
}

export const GUIDE_VIDEO: Record<string, string | null> = {
  land: find('create land.mp4'),
  stock: find('create stock_1.mp4'),
};
