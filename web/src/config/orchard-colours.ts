/**
 * The colours orchards are drawn in on the positioning map.
 *
 * Literal values rather than theme tokens, and deliberately so: these sit on satellite imagery
 * rather than on the app's own surfaces, so they answer to the ground beneath them and not to the
 * light or dark palette. An orchard has to be the same colour in both themes — its colour is what
 * identifies it once several are on the map at once.
 *
 * Picked to stay apart from each other and from aerial imagery, which is mostly green and brown.
 */
export const ORCHARD_COLOURS = [
  '#f94144',
  '#00bbf9',
  '#f9c74f',
  '#9b5de5',
  '#f3722c',
  '#43aa8b',
  '#f15bb5',
  '#577590',
  '#b5e48c',
  '#ff9f1c',
];

/**
 * An orchard's colour, keyed off its id so it never moves — a colour that changed when another
 * orchard was added would make the map lie about which block is which.
 */
export function orchardColour(treeStockId: number): string {
  return ORCHARD_COLOURS[Math.abs(treeStockId) % ORCHARD_COLOURS.length];
}
