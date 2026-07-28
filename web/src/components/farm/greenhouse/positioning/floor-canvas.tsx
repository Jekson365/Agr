import { useRef, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';

import type { GreenhouseSection } from '@/types/greenhouse-section';

export type SectionDraft = Pick<GreenhouseSection, 'x' | 'y' | 'width' | 'height' | 'rotation'>;

type Props = {
  /** The greenhouse's own footprint — the coordinate system every section is placed and bounded
   * within. In the same units as each section's x/y/width/height. */
  greenhouseWidth: number;
  greenhouseLength: number;
  sections: GreenhouseSection[];
  selectedSectionId: number | null;
  onSelect: (id: number | null) => void;
  /** Fired continuously while dragging/resizing/rotating, for a responsive canvas and live-updating
   * property panel. Not persisted — see onCommit. */
  onLiveChange: (id: number, draft: SectionDraft) => void;
  /** Fired once, when the gesture ends — this is the point to persist to the server. */
  onCommit: (id: number, draft: SectionDraft) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  /** sectionId → icon URLs for whatever's planted there, shown in a row below the section's name. */
  sectionIcons?: Record<number, string[]>;
};

/** Minimum on-screen size (in world units) a section can be resized down to. */
const MIN_SIZE = 0.2;
const MIN_ZOOM = 5;
const MAX_ZOOM = 200;

/** A resize handle's position on the section's own (unrotated) box, and which of x/y/width/height
 * it drags. Corners drag two edges at once; edge-midpoints drag one. */
const HANDLES = [
  { key: 'nw', cx: 0, cy: 0, dx: -1, dy: -1 },
  { key: 'n', cx: 0.5, cy: 0, dx: 0, dy: -1 },
  { key: 'ne', cx: 1, cy: 0, dx: 1, dy: -1 },
  { key: 'e', cx: 1, cy: 0.5, dx: 1, dy: 0 },
  { key: 'se', cx: 1, cy: 1, dx: 1, dy: 1 },
  { key: 's', cx: 0.5, cy: 1, dx: 0, dy: 1 },
  { key: 'sw', cx: 0, cy: 1, dx: -1, dy: 1 },
  { key: 'w', cx: 0, cy: 0.5, dx: -1, dy: 0 },
] as const;

function snap(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rotates a delta vector by `degrees` clockwise — used to turn a resize handle's world-space
 * pointer movement into the section's own (unrotated) local frame, so dragging "the corner"
 * always resizes along that corner's edges regardless of how the box is rotated on screen. */
function rotateDelta(dx: number, dy: number, degrees: number): { dx: number; dy: number } {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return { dx: dx * cos + dy * sin, dy: -dx * sin + dy * cos };
}

/**
 * The interactive floor-plan surface: a zoomable, pannable SVG showing the greenhouse's footprint,
 * an optional coordinate grid, and every section on the current floor as a draggable, resizable,
 * rotatable box. Generic enough over "a positioned rectangle" that a future asset placed inside a
 * section (a shelf, a sensor) could reuse the same drag/resize math.
 */
export function FloorCanvas({
  greenhouseWidth,
  greenhouseLength,
  sections,
  selectedSectionId,
  onSelect,
  onLiveChange,
  onCommit,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  showGrid,
  snapToGrid,
  sectionIcons = {},
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const gridSize = 0.5;

  const drag = useRef<{
    kind: 'move' | 'resize' | 'rotate' | 'pan';
    sectionId: number;
    handle?: (typeof HANDLES)[number];
    startPointerWorld: { x: number; y: number };
    startSection: SectionDraft;
    startPan: { x: number; y: number };
  } | null>(null);

  /** Client (screen) coordinates to world (greenhouse) units, undoing the current pan/zoom. */
  function toWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (clientX - rect.left - pan.x) / zoom, y: (clientY - rect.top - pan.y) / zoom };
  }

  function handlePointerDownBody(e: ReactPointerEvent<SVGGElement>, section: GreenhouseSection) {
    e.stopPropagation();
    onSelect(section.id);
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = {
      kind: 'move',
      sectionId: section.id,
      startPointerWorld: toWorld(e.clientX, e.clientY),
      startSection: section,
      startPan: pan,
    };
  }

  function handlePointerDownHandle(e: ReactPointerEvent<SVGRectElement>, section: GreenhouseSection, handle: (typeof HANDLES)[number]) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = {
      kind: 'resize',
      sectionId: section.id,
      handle,
      startPointerWorld: toWorld(e.clientX, e.clientY),
      startSection: section,
      startPan: pan,
    };
  }

  function handlePointerDownRotate(e: ReactPointerEvent<SVGCircleElement>, section: GreenhouseSection) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = {
      kind: 'rotate',
      sectionId: section.id,
      startPointerWorld: toWorld(e.clientX, e.clientY),
      startSection: section,
      startPan: pan,
    };
  }

  function handleBackgroundPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    onSelect(null);
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = {
      kind: 'pan',
      sectionId: -1,
      startPointerWorld: { x: e.clientX, y: e.clientY },
      startSection: { x: 0, y: 0, width: 0, height: 0, rotation: 0 },
      startPan: pan,
    };
  }

  function handlePointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current) return;

    if (current.kind === 'pan') {
      onPanChange({
        x: current.startPan.x + (e.clientX - current.startPointerWorld.x),
        y: current.startPan.y + (e.clientY - current.startPointerWorld.y),
      });
      return;
    }

    const world = toWorld(e.clientX, e.clientY);
    const { startSection } = current;

    if (current.kind === 'move') {
      let x = startSection.x + (world.x - current.startPointerWorld.x);
      let y = startSection.y + (world.y - current.startPointerWorld.y);
      if (snapToGrid) {
        x = snap(x, gridSize);
        y = snap(y, gridSize);
      }
      x = clamp(x, 0, Math.max(0, greenhouseWidth - startSection.width));
      y = clamp(y, 0, Math.max(0, greenhouseLength - startSection.height));
      onLiveChange(current.sectionId, { ...startSection, x, y });
      return;
    }

    if (current.kind === 'rotate') {
      const cx = startSection.x + startSection.width / 2;
      const cy = startSection.y + startSection.height / 2;
      const angle = (Math.atan2(world.y - cy, world.x - cx) * 180) / Math.PI + 90;
      const rotation = ((angle % 360) + 360) % 360;
      onLiveChange(current.sectionId, { ...startSection, rotation });
      return;
    }

    // Resize: convert the world-space pointer delta into the section's own unrotated frame, so
    // dragging a corner always pulls that corner's edges regardless of how it's rotated on screen.
    const handle = current.handle!;
    const worldDx = world.x - current.startPointerWorld.x;
    const worldDy = world.y - current.startPointerWorld.y;
    const { dx: localDx, dy: localDy } = rotateDelta(worldDx, worldDy, startSection.rotation);

    let { x, y, width, height } = startSection;
    if (handle.dx !== 0) {
      if (handle.dx < 0) {
        width = startSection.width - localDx;
      } else {
        width = startSection.width + localDx;
      }
    }
    if (handle.dy !== 0) {
      if (handle.dy < 0) {
        height = startSection.height - localDy;
      } else {
        height = startSection.height + localDy;
      }
    }

    width = Math.max(MIN_SIZE, width);
    height = Math.max(MIN_SIZE, height);
    if (snapToGrid) {
      width = Math.max(MIN_SIZE, snap(width, gridSize));
      height = Math.max(MIN_SIZE, snap(height, gridSize));
    }

    // The center stays fixed for edges/corners that don't move the origin; a handle on the
    // west/north side moves x/y to keep the *opposite* edge anchored instead.
    const cx = startSection.x + startSection.width / 2;
    const cy = startSection.y + startSection.height / 2;
    if (handle.dx < 0) {
      x = startSection.x + startSection.width - width;
    } else if (handle.dx === 0) {
      x = cx - width / 2;
    }
    if (handle.dy < 0) {
      y = startSection.y + startSection.height - height;
    } else if (handle.dy === 0) {
      y = cy - height / 2;
    }

    x = clamp(x, 0, Math.max(0, greenhouseWidth - width));
    y = clamp(y, 0, Math.max(0, greenhouseLength - height));
    // A clamp against the boundary can leave a corner-anchored resize slightly short of the
    // pointer; that's expected — the box simply can't grow past the greenhouse's own edge.
    width = Math.min(width, greenhouseWidth - x);
    height = Math.min(height, greenhouseLength - y);

    onLiveChange(current.sectionId, { x, y, width, height, rotation: startSection.rotation });
  }

  function handlePointerUp(e: ReactPointerEvent<SVGSVGElement>) {
    const current = drag.current;
    drag.current = null;
    if (!current || current.kind === 'pan') return;

    (e.target as Element).releasePointerCapture(e.pointerId);
    const section = sections.find((s) => s.id === current.sectionId);
    if (section) {
      onCommit(current.sectionId, { x: section.x, y: section.y, width: section.width, height: section.height, rotation: section.rotation });
    }
  }

  function handleWheel(e: ReactWheelEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;
    // The world point under the cursor stays fixed while the scale changes, so zooming feels
    // anchored to the mouse rather than to the canvas corner.
    const worldX = (pointerX - pan.x) / zoom;
    const worldY = (pointerY - pan.y) / zoom;
    const nextZoom = clamp(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), MIN_ZOOM, MAX_ZOOM);
    onZoomChange(nextZoom);
    onPanChange({ x: pointerX - worldX * nextZoom, y: pointerY - worldY * nextZoom });
  }

  // Grid line spacing in world units — coarser for a larger greenhouse so the canvas doesn't
  // drown in lines.
  const gridStep = greenhouseWidth > 40 || greenhouseLength > 40 ? 5 : 1;
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (showGrid && greenhouseWidth > 0 && greenhouseLength > 0) {
    for (let gx = 0; gx <= greenhouseWidth + 0.001; gx += gridStep) {
      gridLines.push({ x1: gx, y1: 0, x2: gx, y2: greenhouseLength });
    }
    for (let gy = 0; gy <= greenhouseLength + 0.001; gy += gridStep) {
      gridLines.push({ x1: 0, y1: gy, x2: greenhouseWidth, y2: gy });
    }
  }

  return (
    <svg
      ref={svgRef}
      className="gh-canvas"
      onPointerDown={handleBackgroundPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
        {greenhouseWidth > 0 && greenhouseLength > 0 && (
          <rect
            className="gh-canvas-boundary"
            x={0}
            y={0}
            width={greenhouseWidth}
            height={greenhouseLength}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {gridLines.map((line, i) => (
          <line key={i} className="gh-canvas-grid-line" {...line} vectorEffect="non-scaling-stroke" />
        ))}

        {sections.map((section) => {
          const isSelected = section.id === selectedSectionId;
          const cx = section.x + section.width / 2;
          const cy = section.y + section.height / 2;
          const rotate = `rotate(${section.rotation} ${cx} ${cy})`;

          return (
            <g key={section.id} transform={rotate}>
              <g onPointerDown={(e) => handlePointerDownBody(e, section)} className="gh-section-body">
                <rect
                  x={section.x}
                  y={section.y}
                  width={section.width}
                  height={section.height}
                  className={isSelected ? 'gh-section-rect selected' : 'gh-section-rect'}
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={cx}
                  y={cy}
                  className="gh-section-label"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ fontSize: 14 / zoom }}
                >
                  {section.name}
                </text>
                {(() => {
                  const icons = sectionIcons[section.id];
                  if (!icons || icons.length === 0) return null;
                  const iconSize = 28 / zoom;
                  const gap = 5 / zoom;
                  const totalWidth = icons.length * iconSize + (icons.length - 1) * gap;
                  const startX = cx - totalWidth / 2;
                  const iconY = cy + 12 / zoom;
                  return icons.map((icon, i) => (
                    <image
                      key={i}
                      href={icon}
                      x={startX + i * (iconSize + gap)}
                      y={iconY}
                      width={iconSize}
                      height={iconSize}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ));
                })()}
              </g>

              {isSelected && (
                <>
                  <line
                    className="gh-canvas-grid-line"
                    x1={cx}
                    y1={section.y}
                    x2={cx}
                    y2={section.y - 0.6}
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={cx}
                    cy={section.y - 0.6}
                    r={6 / zoom}
                    className="gh-section-rotate-handle"
                    onPointerDown={(e) => handlePointerDownRotate(e, section)}
                  />
                  {HANDLES.map((handle) => (
                    <rect
                      key={handle.key}
                      x={section.x + handle.cx * section.width - 5 / zoom}
                      y={section.y + handle.cy * section.height - 5 / zoom}
                      width={10 / zoom}
                      height={10 / zoom}
                      className="gh-section-handle"
                      style={{ cursor: `${handle.key}-resize` }}
                      onPointerDown={(e) => handlePointerDownHandle(e, section, handle)}
                    />
                  ))}
                </>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
