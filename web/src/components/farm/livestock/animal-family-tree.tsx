import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';
import './animal-family-tree.css';

type Props = {
  /** The animal the tree is drawn around. */
  animal: LivestockDetail;
  /** Every animal on the farm — an animal's offspring are often kept in another group. */
  all: LivestockDetail[];
  /** Groups by id, for the kind's artwork and the group name under each node. */
  groupsById: Map<number, Livestock>;
};

/** One row of the tree: a generation, and how far it sits from the animal in focus. */
type Generation = { offset: number; animals: LivestockDetail[] };

/** A line to draw, in the overlay's own coordinates, tagged with the couple it descends from so
 *  hovering one of them can pick out its own lines. */
type Segment = { x1: number; y1: number; x2: number; y2: number; parents: number[] };

/** The node width and the gap between nodes at full size, matching animal-family-tree.css. */
const BASE_NODE_WIDTH = 104;
const NODE_GAP = 12;

/** How far the nodes may shrink. Past this a row wraps instead — a litter of forty is not going to
 *  fit on one line at any size worth reading. */
const MIN_SCALE = 0.55;

export function AnimalFamilyTree({ animal, all, groupsById }: Props) {
  const { t } = useLanguage();

  const byId = new Map(all.map((item) => [item.id, item]));
  const generations = buildGenerations(animal, all, byId);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<number, HTMLElement>());
  const [segments, setSegments] = useState<Segment[]>([]);
  /** How much the nodes are shrunk so the widest generation fits across. 1 is full size. */
  const [scale, setScale] = useState(1);
  /** The node under the cursor, whose children are picked out while it is. */
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  /**
   * Measures where the nodes ended up and works out the lines between them.
   *
   * Done from the laid-out DOM rather than from a computed layout of our own: the rows wrap, so
   * where a node sits depends on the width it was given, and only the browser knows that.
   */
  const draw = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    /*
     * Shrink the nodes until the widest generation fits on one line. A pairing with a dozen
     * offspring is common, and at full size that row runs off the page — wrapping it would put
     * siblings on two lines with the connectors crossing between them.
     *
     * Measured from the container's own width, which does not change when the nodes inside it do,
     * so setting the scale cannot feed back into another measurement.
     */
    const widestRow = Math.max(...generations.map((generation) => generation.animals.length));
    const available = container.clientWidth - parseFloat(getComputedStyle(container).paddingLeft || '0');
    const needed = widestRow * (BASE_NODE_WIDTH + NODE_GAP);
    const nextScale = needed > 0 ? Math.min(1, Math.max(MIN_SCALE, available / needed)) : 1;
    // Only when it actually moves: a state write on every measurement would re-render for nothing.
    setScale((prev) => (Math.abs(prev - nextScale) > 0.01 ? nextScale : prev));

    const origin = container.getBoundingClientRect();
    const box = (id: number) => {
      const element = nodeRefs.current.get(id);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        centerX: rect.left - origin.left + rect.width / 2,
        top: rect.top - origin.top,
        bottom: rect.bottom - origin.top,
      };
    };

    const next: Segment[] = [];

    for (const generation of generations) {
      // Children of one pairing, keyed by the pair itself — this is what makes the lines join at
      // the parents and split to their own children rather than running row to row.
      const families = new Map<string, { parents: number[]; children: number[] }>();

      for (const child of generation.animals) {
        const parents = [child.parentOneId, child.parentTwoId].filter(
          (id): id is number => id != null && nodeRefs.current.has(id)
        );
        if (parents.length === 0) continue;

        // Sorted, so the same couple keys the same however the two are stored on each child.
        const key = [...parents].sort((a, b) => a - b).join('-');
        const family = families.get(key) ?? { parents, children: [] };
        family.children.push(child.id);
        families.set(key, family);
      }

      for (const { parents, children } of families.values()) {
        const parentBoxes = parents.map(box).filter((b): b is NonNullable<typeof b> => b != null);
        const childBoxes = children.map(box).filter((b): b is NonNullable<typeof b> => b != null);
        if (parentBoxes.length === 0 || childBoxes.length === 0) continue;

        // The couple's own point: midway between them, just under the lower of the two.
        const junctionX = parentBoxes.reduce((sum, b) => sum + b.centerX, 0) / parentBoxes.length;
        const parentsBottom = Math.max(...parentBoxes.map((b) => b.bottom));
        const childrenTop = Math.min(...childBoxes.map((b) => b.top));
        // The bus sits halfway down the gap, so the drop from the parents and the drops to the
        // children are even whatever the row heights are.
        const busY = (parentsBottom + childrenTop) / 2;

        // Each parent down to the couple's point. Two parents give the two lines that meet.
        for (const parent of parentBoxes) {
          next.push({ x1: parent.centerX, y1: parent.bottom, x2: junctionX, y2: busY, parents });
        }

        // The bus, spanning from the leftmost child to the rightmost — and to the junction, so a
        // couple standing outside the span of their children still reaches it.
        const left = Math.min(junctionX, ...childBoxes.map((b) => b.centerX));
        const right = Math.max(junctionX, ...childBoxes.map((b) => b.centerX));
        if (right - left > 0.5) {
          next.push({ x1: left, y1: busY, x2: right, y2: busY, parents });
        }

        // And down into each child.
        for (const child of childBoxes) {
          next.push({ x1: child.centerX, y1: busY, x2: child.centerX, y2: child.top, parents });
        }
      }
    }

    setSegments(next);
    // generations is rebuilt each render from props; its contents are what matters, and those only
    // change when the props do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, animal.id]);

  useLayoutEffect(() => {
    draw();
    const container = containerRef.current;
    if (!container) return;

    // Rows wrap, so a width change moves nodes without anything re-rendering.
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [draw]);

  if (generations.length <= 1) {
    return (
      <section className="animal-tree">
        <h2 className="animal-tree-title">{t('animalTree.title')}</h2>
        <p className="empty-state">{t('animalTree.empty')}</p>
      </section>
    );
  }

  /**
   * Rows are named by generation rather than by relation. Now that the tree holds the whole
   * family, the row at offset 0 is this animal *and its siblings*, and the one above it holds
   * aunts and uncles beside the parents — so "parents" and "offspring" would each name only part
   * of the row they sat on.
   */
  function generationLabel(offset: number): string {
    if (offset === 0) return t('animalTree.thisGeneration');
    return offset < 0
      ? t('animalTree.generationsUp', { n: Math.abs(offset) })
      : t('animalTree.generationsDown', { n: offset });
  }

  // Who descends from whom, for the hover. Direct children only: lighting up a whole line down to
  // the last generation says less about the animal under the cursor than its own offspring do.
  const childIdsOf = new Map<number, Set<number>>();
  for (const item of all) {
    for (const parentId of [item.parentOneId, item.parentTwoId]) {
      if (parentId == null) continue;
      const set = childIdsOf.get(parentId) ?? new Set<number>();
      set.add(item.id);
      childIdsOf.set(parentId, set);
    }
  }
  const highlighted = hoveredId != null ? (childIdsOf.get(hoveredId) ?? new Set<number>()) : new Set<number>();

  return (
    <section className="animal-tree">
      <h2 className="animal-tree-title">{t('animalTree.title')}</h2>

      <div
        className="animal-tree-levels"
        ref={containerRef}
        style={{ '--tree-scale': scale } as CSSProperties}
      >
        {/* Behind the nodes and ignoring pointers, so the cards above stay clickable. */}
        <svg className="animal-tree-lines" aria-hidden>
          {segments.map((segment, index) => (
            <line
              key={index}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              className={
                hoveredId != null && segment.parents.includes(hoveredId)
                  ? 'animal-tree-line active'
                  : 'animal-tree-line'
              }
            />
          ))}
        </svg>

        {generations.map((generation) => (
          <div key={generation.offset} className="animal-tree-level">
            <span className="animal-tree-level-label">{generationLabel(generation.offset)}</span>

            <div className="animal-tree-nodes">
              {generation.animals.map((item) => {
                const group = groupsById.get(item.livestockId);
                const image = item.imagePath
                  ? resolveAssetUrl(item.imagePath)
                  : livestockImage(group?.type ?? '');

                return (
                  <Link
                    key={item.id}
                    ref={(element) => {
                      if (element) nodeRefs.current.set(item.id, element);
                      else nodeRefs.current.delete(item.id);
                    }}
                    to={`/farm/livestock/${item.livestockId}/animal/${item.id}`}
                    className={[
                      'animal-tree-node',
                      item.id === animal.id ? 'focus' : '',
                      highlighted.has(item.id) ? 'related' : '',
                      hoveredId === item.id ? 'hovered' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onPointerEnter={() => setHoveredId(item.id)}
                    onPointerLeave={() => setHoveredId((prev) => (prev === item.id ? null : prev))}
                  >
                    <img src={image} alt="" className="animal-tree-node-image" />
                    <span className="animal-tree-node-code">{item.code}</span>
                    {group && <span className="animal-tree-node-group">{group.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Every animal related to this one, laid out by generation and ordered oldest first.
 *
 * The whole family, not just this animal's own line: from it the walk goes up to parents and down
 * to children over and over until nothing new is reached, which brings in siblings, cousins, aunts
 * and their offspring. That is what makes the tree the same picture whichever of its animals is
 * being looked at — only the highlight moves — rather than a different, smaller tree per page.
 *
 * An animal is placed in the first generation that reaches it, which both keeps it from appearing
 * twice — a pairing of two animals who share an ancestor puts that ancestor on two branches — and
 * stops the walk looping for ever if bad data ever puts an animal in its own line.
 */
function buildGenerations(
  animal: LivestockDetail,
  all: LivestockDetail[],
  byId: Map<number, LivestockDetail>
): Generation[] {
  // Parent to children, so walking down is a lookup rather than a scan of every animal per step.
  const childrenOf = new Map<number, LivestockDetail[]>();
  for (const item of all) {
    for (const parentId of [item.parentOneId, item.parentTwoId]) {
      if (parentId == null) continue;
      const list = childrenOf.get(parentId);
      if (list) list.push(item);
      else childrenOf.set(parentId, [item]);
    }
  }

  const offsets = new Map<number, number>([[animal.id, 0]]);
  const queue: LivestockDetail[] = [animal];

  while (queue.length > 0) {
    const item = queue.shift()!;
    const offset = offsets.get(item.id)!;

    const visit = (next: LivestockDetail | undefined, nextOffset: number) => {
      if (!next || offsets.has(next.id)) return;
      offsets.set(next.id, nextOffset);
      queue.push(next);
    };

    for (const parentId of [item.parentOneId, item.parentTwoId]) {
      if (parentId != null) visit(byId.get(parentId), offset - 1);
    }
    for (const child of childrenOf.get(item.id) ?? []) {
      visit(child, offset + 1);
    }
  }

  const rows = new Map<number, LivestockDetail[]>();
  for (const [id, offset] of offsets) {
    const item = byId.get(id);
    if (!item) continue;
    const row = rows.get(offset);
    if (row) row.push(item);
    else rows.set(offset, [item]);
  }

  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([offset, animals]) => ({
      offset,
      // Siblings sit together, so the lines from one pairing stay in a bundle instead of crossing
      // the row to reach children scattered along it.
      animals: animals.sort((a, b) => {
        const family = (item: LivestockDetail) =>
          [item.parentOneId ?? 0, item.parentTwoId ?? 0].sort((x, y) => x - y).join('-');
        return family(a).localeCompare(family(b)) || a.id - b.id;
      }),
    }));
}
