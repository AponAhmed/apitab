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
    // `storage` for persistence; host permissions let the background worker
    // perform cross-origin API requests without CORS restrictions.
    permissions: ['storage'],
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
  },
  // Allow headless dev (no auto-launched browser) via WXT_HEADLESS=1.
  webExt: {
    disabled: process.env.WXT_HEADLESS === '1',
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
