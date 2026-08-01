import { useEffect, useState } from 'react';

import { NeighboursPanel } from '@/components/neighbours/neighbours-panel';
import { useLanguage } from '@/contexts/language-context';
import { getNeighbourRequests } from '@/services/neighbour-service';

import './neighbours.css';

function NeighboursIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19" />
      <circle cx="10" cy="8" r="3" />
      <path d="M20 19v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.4 5.2a3 3 0 0 1 0 5.6" />
    </svg>
  );
}

/** The topbar's way into the neighbourhood, with a count of the requests waiting on an answer. */
export function NeighboursButton() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(0);

  // Seed the badge without opening the panel, so a request that arrived while away is visible.
  useEffect(() => {
    let cancelled = false;
    getNeighbourRequests()
      .then((requests) => {
        if (!cancelled) setPending(requests.filter((request) => request.state === 'RequestReceived').length);
      })
      .catch(() => {
        // A badge is not worth an error banner over — the panel reports properly when opened.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const label = t('neighbours.title');

  return (
    <>
      <button
        type="button"
        className="neighbours-button"
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
      >
        <NeighboursIcon />
        {pending > 0 && <span className="neighbours-badge">{pending}</span>}
      </button>

      <NeighboursPanel open={open} onClose={() => setOpen(false)} onPendingCountChange={setPending} />
    </>
  );
}
