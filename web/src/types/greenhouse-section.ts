/** A growing area placed on a greenhouse floor's canvas — the unit of the positioning editor. */
export type GreenhouseSection = {
  id: number;
  greenhouseFloorId: number;
  name: string;
  /** Top-left corner, in the same units as the greenhouse's width/length. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Degrees, clockwise, around the section's own center. 0 = axis-aligned. */
  rotation: number;
};

export type GreenhouseSectionInput = Omit<GreenhouseSection, 'id'>;
