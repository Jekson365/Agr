import { useState } from 'react';

import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';

export function usePlanLimit(max: number | null | undefined, count: number, resource: string) {
  const { t } = useLanguage();
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);
  const atLimit = isAtLimit(max, count);
  const overLimit = isOverLimit(max, count);
  const reachedMessage = t('plans.limitReached', { resource });

  return {
    max: max ?? null,
    count,
    atLimit,
    packetsMessage,
    showPackets: (message: string = reachedMessage) => setPacketsMessage(message),
    closePackets: () => setPacketsMessage(null),
    blocksAdd: () => {
      if (atLimit) setPacketsMessage(reachedMessage);
      return atLimit;
    },
    blocksEdit: () => {
      if (overLimit) setPacketsMessage(t('plans.overLimit', { resource }));
      return overLimit;
    },
  };
}
