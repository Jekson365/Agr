import { buildPlanting, type PlantingPattern, type PlantingPlan } from './orchard-layout';
import type { TerritoryPoint } from './territory';

/** How far the search below is willing to push a spacing before giving up. */
const MAX_SCALE = 64;
const MIN_SCALE = 1 / 32;
const SEARCH_STEPS = 22;

/**
 * The smallest scale in `[low, high]` whose plan comes to no more than `target` trees. The count
 * only falls as a spacing grows, so this is the tightest spacing that still fits — the one that
 * puts the most trees on the ground without going over what the orchard holds.
 *
 * A truncated plan counts as over, never as under. It reports no trees because the walk gave up
 * before it started, not because none fit, and taking that as room to spare would settle on the
 * densest spacing of all and draw nothing.
 */
function fits(plan: PlantingPlan, target: number): boolean {
  return !plan.truncated && plan.trees.length <= target;
}

function tightestFit(
  at: (scale: number) => PlantingPlan,
  target: number,
  low: number,
  high: number
): { plan: PlantingPlan; scale: number } {
  const tightest = at(low);
  if (fits(tightest, target)) return { plan: tightest, scale: low };

  let lower = low;
  let upper = high;
  let best = at(high);
  let bestScale = high;

  for (let step = 0; step < SEARCH_STEPS; step += 1) {
    const mid = (lower + upper) / 2;
    const plan = at(mid);
    if (fits(plan, target)) {
      upper = mid;
      best = plan;
      bestScale = mid;
    } else {
      lower = mid;
    }
  }

  return { plan: best, scale: bestScale };
}

/**
 * The last word on the count: a plan never draws more trees than the orchard holds, however the
 * search went. Reached where the outline is large enough that the walk hit its own ceiling before
 * the spacings could open — a dense pattern over many hectares — and the plan it returned was
 * never fitted to anything.
 */
function capped(plan: PlantingPlan, treeCount: number): PlantingPlan {
  if (plan.trees.length <= treeCount) return plan;

  const trees = plan.trees.slice(0, treeCount);
  const kept = new Set<TerritoryPoint>(trees);
  const runs = plan.runs.map((run) => run.filter((tree) => kept.has(tree))).filter((run) => run.length > 1);

  return { ...plan, trees, runs, fitted: true };
}

/**
 * The plan for an orchard that already has its trees: exactly what it holds, spread over the
 * whole outline.
 *
 * Where the ground would take more trees than the orchard has, filling to the spacings asked for
 * would crowd them into one end and leave the rest bare, so the spacings are opened up until the
 * fill comes to what the orchard holds.
 *
 * A hedgerow is fitted in two passes, because its two spacings do not mean the same thing. The
 * alleys open first, with the row left as tight as it was asked to be — that is what makes it a
 * hedge. Only then is the spacing along the row itself settled, which is the fine adjustment: it
 * closes the gap the alleys alone leave, and it is the only way down when even a single hedge
 * across the whole plot would hold more trees than the orchard has.
 *
 * Whatever it settles on is reported, not hidden: the controls show the spacings actually used.
 */
export function fitPlanting(
  boundary: TerritoryPoint[],
  pattern: PlantingPattern,
  treeSpacing: number,
  rowSpacing: number,
  rotationDegrees: number,
  treeCount: number
): PlantingPlan {
  const asked = buildPlanting(boundary, pattern, treeSpacing, rowSpacing, rotationDegrees);
  if (treeCount <= 0 || asked.trees.length === treeCount) return asked;

  // A truncated plan is not an answer to fit around — it is the walk giving up part way, and its
  // count says nothing about the ground. It still has to be fitted, and hardest of all: it is
  // over the orchard's count by whatever the ceiling happened to be.
  if (pattern !== 'Hedgerow') {
    if (!asked.truncated && asked.trees.length < treeCount) return asked;
    const { plan } = tightestFit(
      (scale) => buildPlanting(boundary, pattern, treeSpacing * scale, rowSpacing * scale, rotationDegrees),
      treeCount,
      1,
      MAX_SCALE
    );
    return capped({ ...plan, fitted: true }, treeCount);
  }

  const { scale: rowScale } = tightestFit(
    (scale) => buildPlanting(boundary, pattern, treeSpacing, rowSpacing * scale, rotationDegrees),
    treeCount,
    1,
    MAX_SCALE
  );

  const rows = rowSpacing * rowScale;
  const { plan } = tightestFit(
    (scale) => buildPlanting(boundary, pattern, treeSpacing * scale, rows, rotationDegrees),
    treeCount,
    MIN_SCALE,
    MAX_SCALE
  );

  return capped(
    { ...plan, fitted: plan.treeSpacing !== treeSpacing || plan.rowSpacing !== rowSpacing },
    treeCount
  );
}
