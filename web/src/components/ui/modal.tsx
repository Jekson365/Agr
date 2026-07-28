import type { MouseEvent, ReactNode } from 'react';
import './modal.css';

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 'full' fills nearly the whole viewport — for editors that need real canvas space (the
   * greenhouse positioning editor) rather than a centered form. Defaults to the normal card. */
  size?: 'default' | 'wide' | 'full';
  /** Extra class on the overlay, for a modal that wants its own width or backdrop treatment. */
  className?: string;
};

export function Modal({ open, onClose, children, size = 'default', className }: Props) {
  if (!open) return null;

  function stop(e: MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div className={className ? `modal-overlay ${className}` : 'modal-overlay'} onClick={onClose}>
      <div className={size === 'default' ? 'modal-card' : `modal-card ${size}`} onClick={stop}>
        {children}
      </div>
    </div>
  );
}
