export type Greenhouse = {
  id: number;
  name: string;
  /** Empty falls back to the greenhouse icon. */
  imagePath: string;
  area: number;
  /** `YYYY-MM-DD`, or null when it isn't known. */
  establishDate: string | null;
  location: string;
  /** The structure's physical size — the coordinate system the positioning editor's floors and
   * sections are placed and bounded within. 0 means the layout hasn't been set up yet. */
  width: number;
  length: number;
  height: number;
};

export type GreenhouseInput = Omit<Greenhouse, 'id'>;
