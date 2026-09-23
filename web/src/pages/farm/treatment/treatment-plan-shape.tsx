import { useCallback, useMemo, useRef, type CSSProperties } from 'react';

import type { PlantingPattern, PlantingPlan } from '@/config/orchard-layout';
import { toLocal } from '@/config/orchard-geometry';
import { drawsRows } from '@/config/planting-patterns';
import type { TerritoryPoint } from '@/config/territory';
import { TreatmentPlanCorners } from './treatment-plan-corners';
import { useCornerDrag } from './use-corner-drag';
import { TreatmentPlanTrees } from './treatment-plan-trees';

/** A tree as the drawing reports it: where it stands on the ground, and which one of the plan it
 *  is — the index is the plan's own, so it survives the sampling below. */
export type PickedTree = { index: number; lat: number; lng: number };

type Props = {
  outline: TerritoryPoint[];
  plan: PlantingPlan;
  pattern: PlantingPattern;
  colour: string;
  /** The projection's fixed point. Taken from the saved outline rather than the live one, so
   *  editing a corner cannot slide every other coordinate as the centroid follows it. */
  origin: TerritoryPoint;
  selected: PickedTree[];
  /** Tree indices that already carry a record, drawn apart from the rest. */
  treated: Set<number>;
  /** While on, the drawing is the outline's editor: handles show, bare ground takes a corner, and
   *  the trees stop answering clicks so one gesture never means two things. */
  editing: boolean;
  onPick: (tree: PickedTree) => void;
  onOutlineChange: (points: TerritoryPoint[]) => void;
};

/** Trees drawn before the picture starts sampling. A block runs to thousands and a panel this size
 *  cannot show them apart, so past this it takes every Nth tree — the pattern still covers the whole
 *  outline rather than one corner of it, and the count beside the drawing stays exact. */
const MAX_DRAWN = 1200;

/** Clear of the outline, in metres, so a tree on the edge is not clipped by the frame. */
const MARGIN = 2;

/**
 * The orchard's planting plan as a flat drawing: the outline it was marked on and a circle where
 * every tree stands. The same geometry the positioning map lays out, drawn on its own rather than
 * over imagery — this panel says where the trees are, not where the ground is.
 */
export function TreatmentPlanShape({
  outline,
  plan,
  pattern,
  colour,
  origin,
  editing,
  selected,
  treated,
  onPick,
  onOutlineChange,
}: Props) {
  const pickedIndexes = new Set(selected.map((tree) => tree.index));
  const svgRef = useRef<SVGSVGElement>(null);

  /* SVG counts y downward and the projection counts it north, so the drawing is flipped once here
     rather than by a transform every coordinate below would have to be read through. */
  const flat = useCallback(
    (point: TerritoryPoint) => {
      const local = toLocal(point, origin);
      return { x: local.x, y: -local.y };
    },
    [origin]
  );

  const corners = useCornerDrag({
    svg: svgRef,
    origin,
    outline,
    onChange: onOutlineChange,
  });

  const shape = useMemo(() => {
    if (outline.length < 3) return null;

    const border = outline.map(flat);
    const stride = Math.max(1, Math.ceil(plan.trees.length / MAX_DRAWN));
    const trees = plan.trees
      .map((point, index) => ({ ...flat(point), index, lat: point.lat, lng: point.lng }))
      .filter((_, index) => index % stride === 0);
    const runs = drawsRows(pattern) ? plan.runs.map((run) => run.map(flat)) : [];

    const radius = Math.max(0.4, Math.min(plan.treeSpacing, plan.rowSpacing) / 3);
    const pad = radius + MARGIN;
    const xs = border.map((point) => point.x);
    const ys = border.map((point) => point.y);
    const minX = Math.min(...xs) - pad;
    const minY = Math.min(...ys) - pad;
    const width = Math.max(...xs) + pad - minX;
    const height = Math.max(...ys) + pad - minY;

    return { border, trees, runs, radius, viewBox: `${minX} ${minY} ${width} ${height}` };
  }, [outline, plan, pattern, flat]);

  if (!shape) return null;

  const path = (points: { x: number; y: number }[]) =>
    points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <svg
      ref={svgRef}
      className={shapeClass(corners.dragging, editing)}
      viewBox={shape.viewBox}
      preserveAspectRatio="xMidYMid meet"
      /* The block's own colour reaches the trees as a property rather than an attribute, so the
         stylesheet can repaint a picked one without a presentation attribute to outrank. */
      style={{ '--tree': colour } as CSSProperties}
    >
      <polygon
        points={path(corners.points.map(flat))}
        fill={colour}
        fillOpacity={0.08}
        stroke={colour}
        strokeOpacity={0.9}
        strokeWidth={2}
        strokeDasharray="6 5"
        vectorEffect="non-scaling-stroke"
      />

      {shape.runs.map((run, index) => (
        <polyline
          key={index}
          points={path(run)}
          fill="none"
          stroke={colour}
          strokeOpacity={0.75}
          strokeWidth={3}
          vectorEffect="non-scaling-stroke"
        />
      ))}

      <TreatmentPlanTrees
        trees={shape.trees}
        radius={shape.radius}
        picked={pickedIndexes}
        treated={treated}
        editing={editing}
        onPick={onPick}
      />

      {editing && (
        <TreatmentPlanCorners
          corners={corners.points.map(flat)}
          colour={colour}
          viewBox={shape.viewBox}
          onAppend={corners.append}
          onStart={corners.start}
          onMove={corners.move}
          onEnd={corners.end}
          onInsert={corners.insert}
          onRemove={corners.remove}
        />
      )}
    </svg>
  );
}

/* While a corner is held the outline can run past the frame, which is measured from the committed
   one — letting it show beats clipping the handle out from under the pointer. */
function shapeClass(dragging: boolean, editing: boolean): string {
  const marks = ['trt-pos-shape'];
  if (editing) marks.push('is-editing');
  if (dragging) marks.push('is-dragging');
  return marks.join(' ');
}
