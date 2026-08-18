export type StockKind = {
  id: number;
  name: string;
  /** Artwork for a kind a user added, as a server path — run it through `resolveAssetUrl`. Empty
   *  on the built-ins, which are drawn from the artwork bundled with the app, keyed by `name`. */
  imagePath: string;
};

export type StockKindInput = Omit<StockKind, 'id'>;
