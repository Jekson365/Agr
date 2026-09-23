import type { PickedTree } from './treatment-plan-shape';

/** Screen pixels, both: what the pointer may hit around a tree, and the halo marking the one
 *  picked. Fixed rather than measured on the ground so a dense block stays usable — over twenty
 *  hectares the painted dot comes out under three pixels across. */
const HIT_PX = 10;
const RING_PX = 10;

export type FlatTree = { x: number; y: number; index: number; lat: number; lng: number };

type Props = {
  trees: FlatTree[];
  radius: number;
  picked: Set<number>;
  treated: Set<number>;
  /** While the outline is being worked on the trees stop answering clicks, so one gesture on the
   *  canvas never means two things. */
  editing: boolean;
  onPick: (tree: PickedTree) => void;
};

export function TreatmentPlanTrees({ trees, radius, picked, treated, editing, onPick }: Props) {
  return (
    <>
      {trees.map((tree) => (
        <circle
          key={`tree-${tree.index}`}
          className={treeClass(picked.has(tree.index), treated.has(tree.index))}
          cx={tree.x}
          cy={tree.y}
          r={radius}
          pointerEvents="none"
        />
      ))}

      {trees
        .filter((tree) => picked.has(tree.index))
        .map((tree) => (
          <circle
            key={`picked-${tree.index}`}
            className="trt-tree-ring"
            cx={tree.x}
            cy={tree.y}
            r={radius}
            strokeWidth={RING_PX}
            vectorEffect="non-scaling-stroke"
          />
        ))}

      {!editing &&
        trees.map((tree) => (
          <circle
            key={`hit-${tree.index}`}
            className="trt-tree-hit"
            cx={tree.x}
            cy={tree.y}
            r={radius}
            strokeWidth={HIT_PX}
            vectorEffect="non-scaling-stroke"
            onClick={() => onPick({ index: tree.index, lat: tree.lat, lng: tree.lng })}
          />
        ))}
    </>
  );
}

/** A tree reads as three separate things at once: plain, already carrying a record, and picked.
 *  Marking is a class rather than a paint so the stylesheet owns how each one looks. */
function treeClass(picked: boolean, treated: boolean): string {
  const marks = ['trt-tree'];
  if (treated) marks.push('is-treated');
  if (picked) marks.push('is-picked');
  return marks.join(' ');
}
