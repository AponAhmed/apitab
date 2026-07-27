/**
 * Base64 <-> ArrayBuffer conversion for file bytes crossing an extension
 * message boundary (page -> background service worker). `ArrayBuffer` looks
 * structured-clone-safe on paper, but empirically does NOT survive
 * `browser.runtime.sendMessage` intact here — it arrives as an empty plain
 * object, which silently stringifies to "[object Object]" inside a `Blob`.
 * A base64 string is JSON-safe by construction, so it's the reliable choice
 * regardless of the messaging layer's actual serialization behavior.
 */

/** Chunked to avoid blowing the call stack on `String.fromCharCode(...bytes)` for large files. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
