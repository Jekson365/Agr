import { useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

import { toLatLng } from '@/config/orchard-geometry';
import type { TerritoryPoint } from '@/config/territory';

/** An outline needs three corners to enclose anything, so the last three cannot be removed. */
const MIN_CORNERS = 3;

type Args = {
  /** The ref itself, not its current value: on the first render that value is still null, and the
   *  handlers built then are the ones the DOM carries until something re-renders. */
  svg: RefObject<SVGSVGElement | null>;
  origin: TerritoryPoint;
  outline: TerritoryPoint[];
  onChange: (points: TerritoryPoint[]) => void;
};

/**
 * Dragging a corner of the planted area.
 *
 * The outline moves under the pointer while the committed one stays put, and only the finished
 * position is reported — the same live/commit split the territory map uses. Here it earns its keep
 * twice over: a fit is a binary search over the whole outline, so replanning per pixel would stall
 * on a large block, and the frame is measured from the outline it draws, so a committed change mid
 * drag would slide the ground out from under the handle being held.
 */
export function useCornerDrag({ svg, origin, outline, onChange }: Args) {
  const [live, setLive] = useState<TerritoryPoint[] | null>(null);
  const held = useRef<number | null>(null);

  const points = live ?? outline;

  function at(event: ReactPointerEvent<SVGElement>): TerritoryPoint | null {
    const node = svg.current;
    const matrix = node?.getScreenCTM();
    if (!node || !matrix) return null;

    const seat = node.createSVGPoint();
    seat.x = event.clientX;
    seat.y = event.clientY;
    const local = seat.matrixTransform(matrix.inverse());
    return toLatLng({ x: local.x, y: -local.y }, origin);
  }

  function start(index: number, event: ReactPointerEvent<SVGElement>) {
    if (event.button !== 0) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    held.current = index;
    setLive(outline);
  }

  function move(event: ReactPointerEvent<SVGElement>) {
    const index = held.current;
    if (index == null) return;

    const point = at(event);
    if (!point) return;
    setLive((prev) => (prev ?? outline).map((row, i) => (i === index ? point : row)));
  }

  function end(event: ReactPointerEvent<SVGElement>) {
    const index = held.current;
    if (index == null) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    held.current = null;
    const settled = live;
    setLive(null);
    if (settled) onChange(settled);
  }

  /* Clicking bare ground puts a corner at the end of the ring, the way a click on the positioning
     map does. The outline is a closed loop, so "the end" is the edge running back to the first. */
  function append(event: ReactPointerEvent<SVGElement>) {
    const point = at(event);
    if (point) onChange([...outline, point]);
  }

  function insert(index: number) {
    const next = outline.slice();
    const a = outline[index];
    const b = outline[(index + 1) % outline.length];
    next.splice(index + 1, 0, { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 });
    onChange(next);
  }

  function remove(index: number, event: { preventDefault: () => void }) {
    event.preventDefault();
    if (outline.length <= MIN_CORNERS) return;
    onChange(outline.filter((_, i) => i !== index));
  }

  return { points, dragging: held.current != null, start, move, end, append, insert, remove };
}
