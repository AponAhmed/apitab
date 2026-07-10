/** Platform/version identifiers for analytics — async to share a call signature with the desktop build's IPC-backed equivalent. */
export async function getPlatform(): Promise<string> {
  return `extension-${import.meta.env.BROWSER}`;
}

export async function getAppVersion(): Promise<string> {
  return browser.runtime.getManifest().version;
}
