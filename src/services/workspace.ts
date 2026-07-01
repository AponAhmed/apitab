/** Path of the full workspace page (built from entrypoints/app). */
export const WORKSPACE_PATH = '/app.html';

export function getWorkspaceUrl(): string {
  return browser.runtime.getURL(WORKSPACE_PATH);
}

/**
 * Opens the ApiTab workspace, focusing an existing tab when one is already open.
 */
export async function openWorkspace(): Promise<void> {
  const url = getWorkspaceUrl();
  try {
    const tabs = await browser.tabs.query({});
    const existing = tabs.find((t) => t.url === url || t.url?.startsWith(url));
    if (existing?.id != null) {
      await browser.tabs.update(existing.id, { active: true });
      if (existing.windowId != null) {
        await browser.windows.update(existing.windowId, { focused: true });
      }
      return;
    }
  } catch {
    // tabs.query may be unavailable; fall through to creating a new tab.
  }
  await browser.tabs.create({ url });
}
