import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// WXT configuration — https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'ApiTab',
    description:
      'Lightweight, local-first API testing tool — a fast, minimal alternative to Postman.',
    // `storage` for persistence; `alarms` drives the periodic team-sync poll
    // (survives service worker suspension, unlike setInterval). Host
    // permissions let extension pages perform cross-origin API requests
    // (both the user's tested APIs and the team-sync backend) without CORS
    // restrictions.
    permissions: ['storage', 'alarms'],
    host_permissions: ['<all_urls>'],
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
    content_security_policy: {
      sandbox:
        "sandbox allow-scripts allow-forms; script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'self';",
    },
  },
  // Allow headless dev (no auto-launched browser) via WXT_HEADLESS=1.
  webExt: {
    disabled: process.env.WXT_HEADLESS === '1',
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
