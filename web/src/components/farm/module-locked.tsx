import { useState } from 'react';

import { PacketsModal } from '@/components/farm/packets-modal';
import { LockIcon } from '@/components/icons/misc-icons';
import { moduleInfo } from '@/config/farm-modules';
import { useLanguage } from '@/contexts/language-context';
import type { FarmModule } from '@/types/auth';
import './module-locked.css';

export function ModuleLocked({ module }: { module: FarmModule }) {
  const { t } = useLanguage();
  const [packetsOpen, setPacketsOpen] = useState(false);

  const info = moduleInfo(module);
  const name = t(info.labelKey);

  return (
    <div className="module-locked">
      <span className="module-locked-art">
        <img src={info.icon} alt="" />
        <span className="module-locked-badge">
          <LockIcon width={18} height={18} aria-hidden="true" />
        </span>
      </span>
      <h1 className="module-locked-title">{t('modules.lockedTitle', { name })}</h1>
      <p className="module-locked-text">{t('modules.lockedText', { name })}</p>
      <button type="button" className="btn" onClick={() => setPacketsOpen(true)}>
        {t('modules.showPackets')}
      </button>

      <PacketsModal
        open={packetsOpen}
        message={t('modules.packetsMessage', { name })}
        onClose={() => setPacketsOpen(false)}
      />
    </div>
  );
}
