/**
 * Google Sign-In via the WebExtensions identity API — the same unified
 * "Web application" OAuth client the desktop app uses (see
 * apitab-desktop/src/main/googleOAuth.ts), just driven through
 * browser.identity.launchWebAuthFlow() instead of a native loopback
 * server, since an extension page can't bind a TCP port.
 *
 * Chrome: browser.identity.getRedirectURL() returns
 * https://<extension-id>.chromiumapp.org/ — registered directly on the
 * OAuth client (the extension's id is pinned via wxt.config.ts's
 * manifest `key`, so this stays stable across builds).
 *
 * Firefox: the equivalent https://<hash>.extensions.allizom.org/ is a
 * Mozilla-owned domain Google won't accept as a redirect URI (unverified
 * ownership). Firefox 86+ also accepts an equivalent loopback form,
 * http://127.0.0.1/mozoauth2/<hash>, which Google DOES accept (the same
 * RFC 8252 loopback exception used for desktop's flow) — built here from
 * the `.extensions.allizom.org` hostname's leading label.
 */

const GOOGLE_CLIENT_ID = '405992136210-fss5livogbvvokl46bdlt839gj8sg3m5.apps.googleusercontent.com';

function base64url(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return base64url(new Uint8Array(digest));
}

function randomBase64Url(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** `getBrowserInfo` only exists in Firefox's WebExtensions implementation — not in WXT's (Chrome-based) runtime types. */
function isFirefox(): boolean {
  return typeof (browser.runtime as unknown as { getBrowserInfo?: unknown }).getBrowserInfo === 'function';
}

/** The redirect_uri to both request from Google and match the flow's return against. */
function buildRedirectUri(): string {
  const raw = browser.identity.getRedirectURL();
  if (!isFirefox()) return raw;

  const hash = new URL(raw).hostname.split('.')[0];
  return `http://127.0.0.1/mozoauth2/${hash}`;
}

export interface GoogleOAuthResult {
  code: string;
  redirectUri: string;
  codeVerifier: string;
}

/** Opens Google's consent screen and resolves once the user completes (or cancels) it. */
export async function runGoogleOAuth(): Promise<GoogleOAuthResult> {
  const state = randomBase64Url(16);
  const codeVerifier = randomBase64Url(32);
  const codeChallenge = await sha256Base64Url(codeVerifier);
  const redirectUri = buildRedirectUri();

  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('state', state);

  const responseUrl = await browser.identity.launchWebAuthFlow({
    url: authorizeUrl.toString(),
    interactive: true,
  });

  if (!responseUrl) throw new Error('Google sign-in was cancelled.');

  const parsed = new URL(responseUrl);
  const code = parsed.searchParams.get('code');
  const returnedState = parsed.searchParams.get('state');
  const error = parsed.searchParams.get('error');

  if (error || !code || returnedState !== state) {
    throw new Error(error ?? 'Google sign-in was cancelled or the redirect was invalid.');
  }

  return { code, redirectUri, codeVerifier };
}
