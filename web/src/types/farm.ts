export type Farm = {
  id: number;
  name: string;
  imagePath: string;
  area: number;
  location: string;
  /**
   * The territory marked out on the map, as a JSON array of `[latitude, longitude]` pairs — see
   * `@/config/territory` for reading and writing it. Null on land saved before the map existed,
   * or by a client that doesn't know the field.
   */
  boundary: string | null;
};

export type FarmInput = Omit<Farm, 'id'>;
