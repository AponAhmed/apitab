/**
 * Runtime error log, day-rotated and capped at 3 days — the extension
 * equivalent of the desktop app's file-backed logger (main/logger.ts).
 * Extensions have no filesystem access, so this uses `browser.storage.local`
 * instead: one array of entries per day, under a `apitab:logs:YYYY-MM-DD`
 * key, so "day file" maps onto "day key" and pruning is just removing stale
 * keys rather than deleting files.
 */

export type LogSource = 'background' | 'app' | 'popup' | 'options';

export interface LogEntry {
  timestamp: number;
  source: LogSource;
  level: 'error' | 'warn';
  message: string;
  stack?: string;
  /** Where this was caught from, e.g. 'window.onerror', a React error boundary's component stack. */
  context?: string;
}

const RETAIN_DAYS = 3;
// Per-day cap, not a total cap — same reasoning as consoleStore.ts's
// CONSOLE_ENTRY_LIMIT: bounds worst-case storage.local usage even if
// something starts erroring in a tight loop, without needing to touch every
// other day's entries to enforce it.
const MAX_ENTRIES_PER_DAY = 200;
const KEY_PREFIX = 'apitab:logs:';

function dayKey(date: Date): string {
  return `${KEY_PREFIX}${date.toISOString().slice(0, 10)}`;
}

function recentDayKeys(days: number): Set<string> {
  const keys = new Set<string>();
  const d = new Date();
  for (let i = 0; i < days; i++) {
    keys.add(dayKey(d));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return keys;
}

async function pruneOldLogs(): Promise<void> {
  const all = await browser.storage.local.get(null);
  const keep = recentDayKeys(RETAIN_DAYS);
  const stale = Object.keys(all).filter((k) => k.startsWith(KEY_PREFIX) && !keep.has(k));
  if (stale.length) await browser.storage.local.remove(stale);
}

/**
 * Appends one entry to today's log, pruning anything outside the retention
 * window. Never throws — a logging failure must not cascade into whatever
 * error handler called this in the first place.
 */
export async function logError(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
  try {
    const key = dayKey(new Date());
    const existing = await browser.storage.local.get(key);
    const stored = existing[key];
    const entries: LogEntry[] = Array.isArray(stored) ? (stored as LogEntry[]) : [];
    entries.push({ ...entry, timestamp: Date.now() });
    await browser.storage.local.set({ [key]: entries.slice(-MAX_ENTRIES_PER_DAY) });
    await pruneOldLogs();
  } catch {
    // Swallow — see doc comment above.
  }
}

/** All retained entries (up to 3 days), oldest day first, for exporting/display. */
export async function getAllLogs(): Promise<LogEntry[]> {
  const all = await browser.storage.local.get(null);
  const dayKeys = Object.keys(all)
    .filter((k) => k.startsWith(KEY_PREFIX))
    .sort();
  return dayKeys.flatMap((k) => (Array.isArray(all[k]) ? (all[k] as LogEntry[]) : []));
}

function formatEntry(entry: LogEntry): string {
  const header = `${new Date(entry.timestamp).toISOString()} [${entry.source}] [${entry.level}]${entry.context ? ` (${entry.context})` : ''} ${entry.message}\n`;
  const stack = entry.stack
    ? entry.stack
        .split('\n')
        .map((l) => `    ${l}`)
        .join('\n') + '\n'
    : '';
  return header + stack;
}

/** Plain-text rendering of every retained entry, same line format as the desktop app's log files. */
export async function exportLogsAsText(): Promise<string> {
  const entries = await getAllLogs();
  if (entries.length === 0) return 'No log entries in the last 3 days.\n';
  return entries.map(formatEntry).join('');
}

/**
 * Registers global error/unhandledrejection listeners for whatever catches a
 * React error boundary can't (an error thrown outside render — an event
 * handler, a store action). Call once per entry point, as early as possible.
 *
 * Uses `self` rather than `window`: in a page context (app/popup/options)
 * `self` is just an alias for `window`, but the background entry point is an
 * MV3 service worker, which has no `window` at all — only the global scope
 * (`self`), which supports the same two events.
 */
export function installRuntimeLogging(source: LogSource): void {
  self.addEventListener('error', (e) => {
    void logError({
      source,
      level: 'error',
      message: e.message,
      stack: e.error instanceof Error ? e.error.stack : undefined,
      context: 'onerror',
    });
  });

  self.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason as unknown;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    void logError({ source, level: 'error', message, stack, context: 'unhandledrejection' });
  });
}
