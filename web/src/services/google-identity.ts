// Minimal typings + on-demand loader for Google Identity Services (GIS).
// We use the "Sign in with Google" ID-token flow: the rendered button hands us a `credential`
// (a Google-signed JWT), which the backend verifies at POST /api/auth/google.
// Docs: https://developers.google.com/identity/gsi/web

export type GoogleCredentialResponse = {
  /** The Google-issued ID token (JWT). Absent if the flow was dismissed. */
  credential?: string;
  select_by?: string;
};

type GoogleIdInitConfig = {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  ux_mode?: 'popup' | 'redirect';
  auto_select?: boolean;
};

type GoogleButtonOptions = {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
};

export type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (config: GoogleIdInitConfig) => void;
      renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
      prompt: () => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

let loadPromise: Promise<GoogleIdentity> | null = null;

/** Loads the Google Identity Services script exactly once and resolves with `window.google`. */
export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  if (window.google) {
    return Promise.resolve(window.google);
  }
  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const fail = () => reject(new Error('Failed to load Google Identity Services.'));
    const onLoad = () =>
      window.google ? resolve(window.google) : fail();

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', fail, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', fail, { once: true });
    document.head.appendChild(script);
  });

  return loadPromise;
}
