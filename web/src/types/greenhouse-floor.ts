/** One level of a greenhouse's layout — most greenhouses have exactly one; a multi-level
 * structure has several, each with its own set of sections. */
export type GreenhouseFloor = {
  id: number;
  greenhouseId: number;
  name: string;
  /** Display order in the floor switcher. Assigned by the server; not client-editable. */
  sortOrder: number;
};

export type GreenhouseFloorInput = Omit<GreenhouseFloor, 'id' | 'sortOrder'>;
