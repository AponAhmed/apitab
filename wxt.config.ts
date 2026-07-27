import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// WXT configuration — https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ browser }) => ({
    name: 'ApiTab',
    description:
      'Lightweight, local-first API testing tool — a fast, minimal API client.',
    // `storage` for persistence; `alarms` drives the periodic team-sync poll
    // (survives service worker suspension, unlike setInterval). Host
    // permissions let extension pages perform cross-origin API requests
    // (both the user's tested APIs and the team-sync backend) without CORS
    // restrictions.
    permissions: ['storage', 'alarms', 'identity'],
    host_permissions: ['<all_urls>'],
    // Pins the Chrome extension's id (otherwise it's derived from the local
    // install path and differs per machine for a "Load unpacked" install).
    // A stable id is required for Google Sign-In: chrome.identity.launchWebAuthFlow's
    // redirect is https://<id>.chromiumapp.org/, which has to be registered
    // as a fixed Authorized redirect URI on the Google OAuth client ahead of
    // time. This is the *public* half of a keypair generated once — losing
    // the private half only matters if this extension is later packed into a
    // signed .crx or uploaded as the very first Chrome Web Store version.
    ...(browser !== 'firefox'
      ? {
          key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsy1UiholtHg/WK6omvoxZpMESHdWbemCh8YLBSTlnqFmrmQvEvdBrjkz0Jpnwu8rsqmNAJaMDIeX0GB+S91H1sC4AKaqqNT5IuPb1zg58ImLiZCOLEhUCeBx3iquBzrwh+Cw7QOXRb1qDy/4A/nKkchJsZgCQa63SleS3DQoxrOjUkxlvy0gR6Rw551sGAU0OxWa3Kz+0p81VsSkS7NVwo2DX4ZmdaVwF9HLCnA0xW00KCCdmUoqEUK03ict1BfeiLE3tT61T6m+vGEPnaMe6u+K865c8B45dvidnuxj9Y20caCKO3Xfoh55NudJ7u1aUWKRgD6a7gmPURaoQCF0yQIDAQAB',
        }
      : {}),
    action: {
      default_title: 'ApiTab — Open API tester',
    },
    commands: {
      'open-apitab': {
        suggested_key: { default: 'Ctrl+Shift+U' },
        description: 'Open the ApiTab workspace',
      },
    },
    // Sandbox page runs user pre-request/post-response scripts (needs eval,
    // which extension pages forbid).
    sandbox: { pages: ['sandbox.html'] },
    // Firefox has no equivalent of Chrome's sandboxed-page origin isolation —
    // the `sandbox` manifest key/CSP is a no-op there, so sandbox.html just
    // loads as a regular extension page under the `extension_pages` CSP.
    // Chrome MV3 forbids 'unsafe-eval' in `extension_pages` entirely, so eval
    // there is confined to the isolated sandbox origin instead.
    content_security_policy:
      browser === 'firefox'
        ? { extension_pages: "script-src 'self' 'unsafe-eval'; object-src 'self';" }
        : {
            sandbox:
              "sandbox allow-scripts allow-forms; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'self';",
          },
    browser_specific_settings: {
      gecko: {
        id: '{94f73efd-e2be-4067-b2e9-be05268189d1}',
        // Core extension collects nothing; the optional team-sync feature
        // sends account name/email and password to our own backend only
        // when a user opts in by signing in.
        data_collection_permissions: {
          required: ['none'],
          optional: ['personallyIdentifyingInfo', 'authenticationInfo'],
        },
      },
    },
  }),
  // Allow headless dev (no auto-launched browser) via WXT_HEADLESS=1.
  webExt: {
    disabled: process.env.WXT_HEADLESS === '1',
  },
  vite: () => ({
    plugins: [tailwindcss()],
    server: {
      // The sandbox page (src/entrypoints/sandbox) runs with an opaque
      // (`null`) origin, per its manifest `sandbox` CSP — required so it can
      // `new Function(...)` user pre-request/post-response scripts, which
      // regular extension pages forbid. In dev mode its module scripts are
      // served live from this Vite server for HMR; without permissive CORS,
      // the browser blocks those fetches (opaque origin can't satisfy same-
      // origin), the sandbox's own code never runs, and every script times
      // out with "Script sandbox was reset." Production builds are
      // self-contained and unaffected.
      cors: true,
    },
  }),
});
