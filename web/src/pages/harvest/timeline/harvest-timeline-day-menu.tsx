import { useEffect, useRef } from 'react';

import { ActivityIcon } from '@/components/icons/activity-icons';
import { HARVEST_ACTIVITIES, harvestActivityLabel, type HarvestActivity } from '@/config/harvest-activity';
import { useLanguage } from '@/contexts/language-context';
import './harvest-timeline-day-menu.css';

type Props = {
  x: number;
  y: number;
  /** What the day already carries, so the list can show which activities are on it. */
  activities: string[];
  onToggle: (activity: HarvestActivity) => void;
  onRemove: () => void;
  onClose: () => void;
};

/** What a day of a harvest offers: the field work it carries, picked from the farm's fixed list.
 *  Opened by right-clicking the day, so the ordinary click stays free for reading. */
export function HarvestTimelineDayMenu({ x, y, activities, onToggle, onRemove, onClose }: Props) {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The listener is on window in the capture phase, so it runs before the press reaches anything
    // inside the menu — React's own handlers run later, at the root. Without this check the menu
    // would close on the very press that was aiming at one of its own controls.
    function dismiss(event: Event) {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      onClose();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    // Capture, so the click that lands on another day closes this before opening that one.
    window.addEventListener('pointerdown', dismiss, true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', dismiss);
    window.addEventListener('scroll', dismiss, true);
    return () => {
      window.removeEventListener('pointerdown', dismiss, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', dismiss);
      window.removeEventListener('scroll', dismiss, true);
    };
  }, [onClose]);

  return (
    <div ref={menuRef} className="hcal-day-menu" style={{ left: x, top: y }} role="menu">
      {HARVEST_ACTIVITIES.map((activity) => {
        const active = activities.includes(activity);
        return (
          <button
            key={activity}
            type="button"
            className={active ? 'hcal-day-menu-item active' : 'hcal-day-menu-item'}
            role="menuitemcheckbox"
            aria-checked={active}
            onClick={() => onToggle(activity)}
          >
            <ActivityIcon activity={activity} className="hcal-day-menu-icon" width={17} height={17} />
            <span className="hcal-day-menu-label">{harvestActivityLabel(activity, t)}</span>
            {active && (
              <svg
                className="hcal-day-menu-tick"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 13 4 4 10-10" />
              </svg>
            )}
          </button>
        );
      })}

      {activities.length > 0 && (
        <button type="button" className="hcal-day-menu-item danger" role="menuitem" onClick={onRemove}>
          <span className="hcal-day-menu-icon" />
          <span className="hcal-day-menu-label">{t('harvestTimeline.unmarkDay')}</span>
        </button>
      )}
    </div>
  );
}
