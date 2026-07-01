# ApiTab

> A lightweight, local‑first API testing browser extension — a fast, minimal alternative to Postman.

ApiTab opens instantly inside your browser and gives you a frictionless API testing experience: build requests, manage collections and environments, generate code snippets, and import/export cURL — all stored locally, **no login and no cloud required**.

Built with **WXT + React + TypeScript + Tailwind CSS + Zustand**.

---

## Features

- **Request Builder** — `GET` `POST` `PUT` `PATCH` `DELETE` `OPTIONS` `HEAD`
  - Query params (kept in sync with the URL), dynamic headers with suggestions
  - Auth: No Auth · Bearer Token · Basic Auth · API Key (header or query)
  - Body: JSON (with beautify + live validation) · Raw · Form URL Encoded · Form Data
- **Response Viewer**
  - Status code, response time, response size
  - Pretty / Raw body with JSON syntax highlighting, response headers table
  - Generated **cURL** + **code snippets**: Fetch, Axios, PHP cURL, Laravel HTTP, Python Requests
- **Collections** — create, rename, duplicate, delete; save / update / duplicate / delete requests; search
- **History** — automatic, keeps the latest *N* requests; reopen, delete, clear all
- **Environments** — Development / Staging / Production with `{{variables}}` resolved automatically before sending
- **cURL import/export** — paste a `curl` command (or paste directly into the URL bar) to populate the request
- **Workspace persistence** — collections, requests, environments, history, draft and UI prefs survive restarts
- **Dark mode**, keyboard shortcuts, JSON backup import/export, and friendly error handling

---

##  Tech Stack

| Area | Choice |
| --- | --- |
| Framework | [WXT](https://wxt.dev) (Manifest V3), Vite |
| UI | React 19, TypeScript, Tailwind CSS v4, Lucide icons |
| State | Zustand (with `browser.storage.local` persistence) |
| HTTP | Background service‑worker `fetch` (CORS‑free) |
| Utilities | UUID, custom cURL parser, code‑snippet generator |

---

##  Getting Started

### Prerequisites

- **Node.js ≥ 18** (developed on Node 22)
- npm (or pnpm/yarn)

### Install

```bash
npm install
```

### Develop (hot reload)

```bash
npm run dev          # Chrome
npm run dev:firefox  # Firefox
```

WXT launches a browser with the extension loaded. Open the popup and click **Open ApiTab**, or press **Ctrl+Shift+U**.

### Build for production

```bash
npm run build          # -> .output/chrome-mv3
npm run build:firefox  # -> .output/firefox-mv2
npm run zip            # zipped, store-ready bundle
```

### Load the unpacked build manually

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the **`.output/chrome-mv3`** folder.
4. Click the ApiTab icon → **Open ApiTab** (or press **Ctrl+Shift+U**).

> ⚠️ **`chrome-mv3` vs `chrome-mv3-dev`** — `npm run build` produces the
> self‑contained **`.output/chrome-mv3`** (load this for normal use). `npm run dev`
> produces **`.output/chrome-mv3-dev`**, which loads your source from the WXT dev
> server at `http://localhost:3000` for hot reload — it only works **while
> `npm run dev` is running**. Loading `chrome-mv3-dev` without the dev server shows
> a blank page with `localhost:3000 … ERR_CONNECTION_REFUSED` in the console.

### Troubleshooting

- **Blank page / `localhost:3000 ERR_CONNECTION_REFUSED`** — you loaded the
  `chrome-mv3-dev` folder without the dev server. Either run `npm run build` and
  load `chrome-mv3`, or keep `npm run dev` running.
- **`$RefreshReg$ is not defined`** — a React Fast Refresh/Vite incompatibility.
  This project pins **Vite 7 + @vitejs/plugin-react 5** to avoid it; if you bump
  to Vite 8 / plugin-react 6, the dev preamble breaks under WXT.

---

## Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Send request | `Ctrl + Enter` |
| Save request | `Ctrl + S` |
| Copy as cURL | `Ctrl + Shift + K` |
| New request | `Ctrl + Alt + N` |
| Open ApiTab | `Ctrl + Shift + U` |

---

## Usage

**Environment variables** — create an environment in the sidebar, add `base_url`, `token`, `api_key`, etc., then select it from the top bar. Reference them anywhere with `{{base_url}}/users`. Variables are resolved just before the request is sent and in the generated cURL/code.

**Saving requests** — press `Ctrl + S` or **Save** to store the request in a collection. Re‑opening a saved request lets `Ctrl + S` update it in place.

**Import cURL** — click the terminal icon in the request toolbar, or simply paste a `curl …` command into the URL field.

**Backup** — Options page → **Export backup** / **Import backup** (JSON). Everything is stored locally; you can wipe it with **Clear all data**.

---

## Architecture

```
src/
├── entrypoints/        # WXT entrypoints
│   ├── app/            # Full workspace page  (app.html)
│   ├── popup/          # Toolbar popup
│   ├── options/        # Settings page
│   └── background.ts   # Service worker: executes requests, handles commands
├── components/         # Reusable UI (ui/), KeyValueEditor, dialogs, Toaster
├── features/           # Feature modules
│   ├── requests/       # URL bar, request tabs, response viewer, snippets
│   ├── collections/    # Collections panel
│   ├── environments/   # Environments panel + selector
│   ├── history/        # History panel
│   └── layout/         # TopBar, Sidebar, Workspace
├── hooks/              # useApplyTheme, useKeyboardShortcuts, useActiveVariables, …
├── stores/             # Zustand stores (request, collections, environments, history, settings, ui)
├── services/           # requestService, httpClient, messaging, workspace, backup
├── utils/              # variables, curl, snippets, query, json, format, highlight
├── types/              # Shared TypeScript types
└── assets/             # Tailwind entry stylesheet
```

**Why a background `fetch`?** Requests run in the background service worker, which — combined with `host_permissions: <all_urls>` — bypasses page CORS restrictions and can read **every** response header, along with accurate timing and size. The UI talks to it over typed `runtime` messaging.

**Storage** — each store persists to `browser.storage.local` via a small Zustand adapter, so the entire workspace survives a browser restart.

### Future‑proof by design

The folder structure and the `PreparedRequest` abstraction make it straightforward to add the following later **without** touching the core: GraphQL, WebSocket testing, test assertions, an AI request builder, team workspaces and cross‑browser sync.

> Note: the live request engine uses the service‑worker `fetch` for correctness in an extension context. `axios` is included in the stack and is the target of the Axios **code‑snippet** generator.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start WXT dev server (Chrome) |
| `npm run build` | Production build |
| `npm run zip` | Build a store‑ready zip |
| `npm run compile` | Type‑check with `tsc --noEmit` |

---

## License

MIT — use it, fork it, ship it.
