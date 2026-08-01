/**
 * Where you stand with another user. Told from your side: the one pending request is `RequestSent`
 * to whoever sent it and `RequestReceived` to whoever has to answer it.
 */
export type NeighbourState = 'None' | 'Neighbour' | 'RequestSent' | 'RequestReceived';

/** One crop growing on a piece of land, as its owner recorded it. */
export type TerritoryCrop = {
  /** The catalogue kind — translate with `cropLabel`, which falls back to the name as typed. */
  crop: string;
  /** What the grower calls the fruit planted here ("Gala" rather than "Apple"), or empty. */
  name: string;
  area: number;
};

/**
 * Someone else's land as the map needs it — an accepted neighbour's, or any other farmer's.
 * Deliberately thin: a map draws many of these at once, and who they are and what they grow is
 * only worth fetching for the one picked out. See {@link TerritoryDetails}.
 */
export type NeighbourTerritory = {
  userId: number;
  name: string;
  surname: string;
  /** True for an accepted neighbour, false for any other farmer. */
  isNeighbour: boolean;
  /** Kilometres from your nearest field, where both can be placed. For display only. */
  distanceKm: number | null;
  farmId: number;
  farmName: string;
  /** The outline, in the same JSON form as a farm's own boundary. */
  boundary: string;
  area: number;
};

/** One territory in full: who farms it, and what they have growing there. */
export type TerritoryDetails = {
  userId: number;
  name: string;
  surname: string;
  imagePath: string;
  city: string;
  country: string;
  isNeighbour: boolean;
  distanceKm: number | null;
  farmId: number;
  farmName: string;
  area: number;
  crops: TerritoryCrop[];
};

/** Another user as you see them — their public profile plus your link to them. */
export type Neighbour = {
  userId: number;
  name: string;
  surname: string;
  email: string;
  imagePath: string;
  city: string;
  country: string;
  /** Only sent for accepted neighbours; empty for anyone else. */
  phoneNumber: string;
  state: NeighbourState;
  /** Straight-line kilometres between the two pinned farm locations, null unless both pinned one. */
  distanceKm: number | null;
  requestedAt: string | null;
  acceptedAt: string | null;
};
