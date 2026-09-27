import { useEffect, useRef } from 'react';

import { loadGoogleIdentity, type GoogleCredentialResponse } from '@/services/google-identity';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GOOGLE_BUTTON_MAX_WIDTH = 400;

export function useGoogleButton(onCredential: (response: GoogleCredentialResponse) => void) {
  const slotRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentity()
      .then((google) => {
        const slot = slotRef.current;
        if (cancelled || !slot) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => callbackRef.current(response),
          ux_mode: 'popup',
        });
        google.accounts.id.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(slot.offsetWidth || 320, GOOGLE_BUTTON_MAX_WIDTH),
        });
      })
      .catch((err) => console.error('[login] failed to load Google Identity Services:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  return slotRef;
}
