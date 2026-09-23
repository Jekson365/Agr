import type { PointerEvent as ReactPointerEvent } from 'react';

import './treatment-corners.css';

type Flat = { x: number; y: number };

/**
 * Handle radius as a fraction of the frame's width, in the drawing's own metres.
 *
 * Not screen pixels via a non-scaling stroke, which is what a handle wants to *look* like: a
 * hairline circle wearing a thick stroke is painted at the right size but barely hit-tested, since
 * browsers test the stroke region from the untransformed geometry. A real radius is hit-tested
 * like any filled circle, and taking it from the frame keeps it the same size on screen whatever
 * the block measures.
 */
const HANDLE_SHARE = 1 / 45;
const MIDPOINT_SHARE = 1 / 65;

/** How much further than it looks a handle may be grabbed from. */
const GRAB = 1.9;

type HandlesProps = {
  corners: Flat[];
  colour: string;
  /** The frame, so bare ground inside it can take a click. */
  viewBox: string;
  onAppend: (event: ReactPointerEvent<SVGElement>) => void;
  onStart: (index: number, event: ReactPointerEvent<SVGElement>) => void;
  onMove: (event: ReactPointerEvent<SVGElement>) => void;
  onEnd: (event: ReactPointerEvent<SVGElement>) => void;
  onInsert: (index: number) => void;
  onRemove: (index: number, event: { preventDefault: () => void }) => void;
};

export function TreatmentPlanCorners({
  corners,
  colour,
  viewBox,
  onAppend,
  onStart,
  onMove,
  onEnd,
  onInsert,
  onRemove,
}: HandlesProps) {
  const [x, y, width, height] = viewBox.split(' ').map(Number);
  const handle = width * HANDLE_SHARE;
  const midpoint = width * MIDPOINT_SHARE;

  return (
    <>
      <rect
        className="trt-canvas"
        x={x}
        y={y}
        width={width}
        height={height}
        onPointerDown={onAppend}
      />

      {corners.map((corner, index) => {
        const next = corners[(index + 1) % corners.length];
        return (
          <circle
            key={`mid-${index}`}
            className="trt-corner-mid"
            cx={(corner.x + next.x) / 2}
            cy={(corner.y + next.y) / 2}
            r={midpoint}
            stroke={colour}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            onClick={() => onInsert(index)}
          />
        );
      })}

      {corners.map((corner, index) => (
        <circle
          key={`corner-${index}`}
          className="trt-corner"
          cx={corner.x}
          cy={corner.y}
          r={handle}
          stroke={colour}
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {/* The grab targets, over every handle so none of them shadows another. Transparent and
          wider than the dots they sit on, because a corner is aimed at roughly. */}
      {corners.map((corner, index) => (
        <circle
          key={`grab-${index}`}
          className="trt-corner-grab"
          cx={corner.x}
          cy={corner.y}
          r={handle * GRAB}
          onPointerDown={(event) => onStart(index, event)}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
          onContextMenu={(event) => onRemove(index, event)}
        />
      ))}
    </>
  );
}
