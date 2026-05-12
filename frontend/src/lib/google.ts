// Google Identity Services helper. Lazily loads the gsi/client script and
// renders a one-tap-style button into the supplied DOM node. When
// VITE_GOOGLE_CLIENT_ID is unset, isGoogleConfigured() returns false and the
// UI is expected to hide the button.

type GoogleButtonOptions = {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'small' | 'medium' | 'large';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            ux_mode?: 'popup' | 'redirect';
          }) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export function getGoogleClientId(): string | null {
  const raw = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  return raw.trim().length > 0 ? raw.trim() : null;
}

export function isGoogleConfigured(): boolean {
  return getGoogleClientId() !== null;
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export async function renderGoogleButton(
  element: HTMLElement,
  onCredential: (credential: string) => void,
  options: GoogleButtonOptions = {},
): Promise<void> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID is not configured');

  await loadGoogleScript();
  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services failed to initialize');
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => onCredential(response.credential),
    cancel_on_tap_outside: true,
    ux_mode: 'popup',
  });

  element.innerHTML = '';
  window.google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: 320,
    ...options,
  });
}
