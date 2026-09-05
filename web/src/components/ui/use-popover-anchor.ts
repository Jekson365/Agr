import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export type PopoverAnchor = { top: number; left: number; width: number };

export function usePopoverAnchor(
  open: boolean,
  setOpen: (open: boolean) => void,
  maxHeight: number
) {
  const [rect, setRect] = useState<PopoverAnchor | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      // The popover is portalled out of the control, so it is no longer inside rootRef and has to
      // be asked about separately — without this, clicking an option would close the list first.
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  /*
   * Portalled to <body> and positioned from the trigger's box, so a modal card with
   * overflow-y:auto cannot clip it — the same treatment kind-dropdown.tsx needed, and for the
   * same reason. Placed on layout rather than in an effect, so it never paints at the wrong spot
   * first.
   */
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const box = trigger.getBoundingClientRect();

      // Flip above the field when there is not room under it.
      const below = window.innerHeight - box.bottom;
      const top =
        below < maxHeight && box.top > below ? box.top - maxHeight - 6 : box.bottom + 6;
      setRect({ top: Math.max(8, top), left: box.left, width: box.width });
    }

    place();
    // Capture phase, so it follows the trigger when an ancestor scrolls rather than only the page.
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, maxHeight]);

  return { rect, rootRef, triggerRef, popoverRef };
}
