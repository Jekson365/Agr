import { useState } from 'react';
import { createPortal } from 'react-dom';

import { PacketsModal } from '@/components/farm/packets-modal';
import { LockIcon } from '@/components/icons/misc-icons';
import type { NavItem } from '@/config/nav-items';
import { useLanguage } from '@/contexts/language-context';

export function SidebarLockedItem({ item }: { item: NavItem }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const label = t(item.labelKey);

  return (
    <div className="sidebar-group">
      <div className="sidebar-group-header">
        <button
          type="button"
          className="sidebar-link sidebar-link-toggle sidebar-link-locked"
          title={t('modules.lockedBadge')}
          onClick={() => setOpen(true)}
        >
          <img src={item.icon} className="sidebar-link-icon" alt="" />
          <span>{label}</span>
          <LockIcon className="sidebar-lock-icon" aria-hidden="true" />
        </button>
      </div>
      {createPortal(
        <PacketsModal
          open={open}
          message={t('modules.packetsMessage', { name: label })}
          onClose={() => setOpen(false)}
        />,
        document.body
      )}
    </div>
  );
}
