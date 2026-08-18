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
  /**
   * Whether the owner has taken this land out of use. Unlike the removed rows elsewhere, which
   * drop out of their list, removed land **stays on the land page** as a disabled card — the
   * plots, herds and harvests recorded on it are still there, and land that vanished would take
   * the explanation for all of them with it. It takes no edits, is offered by no picker, and does
   * not count against the plan's land limit until it is restored.
   */
  isRemoved: boolean;
};

export type FarmInput = Omit<Farm, 'id' | 'isRemoved'>;
