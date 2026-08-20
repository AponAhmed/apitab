import type { ApiError, RequestResult, ResponseHeader } from '@/types';
import { base64ToArrayBuffer } from '@/utils/binary';
import type { WireRequest } from './messaging';

function classifyError(err: unknown): ApiError {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { type: 'timeout', message: 'Request timed out.' };
  }
  if (err instanceof TypeError) {
    // Chromium rarely gives more than "Failed to fetch", but surface
    // anything beyond that generic text when it's available.
    const detail = err.message && err.message !== 'Failed to fetch' ? err.message : undefined;
    return {
      type: 'network',
      message: detail
        ? `Network error: ${detail}`
        : // Unlike the desktop app's Node-based request layer, the browser
          // gives extensions no way to distinguish a TLS certificate failure
          // from any other network error, or to bypass one — that's a
          // browser-level security boundary no extension API can override.
          // If this is a local dev server with a self-signed certificate,
          // visiting its URL directly in a browser tab once and accepting
          // the security warning there is the actual workaround.
          'Network error — the host may be unreachable, the DNS lookup failed, the request was blocked, or (for a local HTTPS server with a self-signed certificate) the browser doesn\'t trust it yet. For the last case, open the URL directly in a browser tab once and accept the security warning there.',
    };
  }
  return { type: 'unknown', message: (err as Error)?.message ?? 'Unknown error' };
}

/**
 * Performs the actual HTTP request. Runs in the background service worker, which
 * — combined with host permissions — bypasses page CORS restrictions and can
 * read every response header.
 */
export async function executeHttp(req: WireRequest): Promise<RequestResult> {
  if (!/^https?:\/\//i.test(req.url)) {
    return {
      ok: false,
      error: {
        type: 'invalid-url',
        message: req.url
          ? `Invalid URL: "${req.url}". URLs must start with http:// or https://`
          : 'URL is required.',
      },
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs);
  const start = performance.now();

  try {
    const headers = new Headers();
    for (const [key, value] of req.headers) {
      if (key) headers.append(key, value);
    }

    let body: BodyInit | undefined;
    const methodAllowsBody = req.method !== 'GET' && req.method !== 'HEAD';
    if (methodAllowsBody) {
      if (req.bodyType === 'form-data' && req.formData?.length) {
        const fd = new FormData();
        for (const f of req.formData) {
          if (!f.key) continue;
          if (f.fileData) {
            const bytes = base64ToArrayBuffer(f.fileData);
            fd.append(f.key, new Blob([bytes], { type: f.fileType || 'application/octet-stream' }), f.fileName || 'file');
          } else {
            fd.append(f.key, f.value);
          }
        }
        body = fd;
        // Let the browser set the multipart boundary.
        headers.delete('content-type');
      } else if (req.bodyType === 'binary' && req.binary) {
        // A Blob body's own `type` becomes the Content-Type header
        // automatically per the fetch spec, but only when the caller hasn't
        // already set one — an explicit header (set below) still wins.
        const bytes = base64ToArrayBuffer(req.binary.fileData);
        body = new Blob([bytes], { type: req.binary.fileType || 'application/octet-stream' });
      } else if (req.body) {
        body = req.body;
      }
    }

    const res = await fetch(req.url, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
      redirect: 'follow',
      credentials: 'omit',
    });

    const buffer = await res.arrayBuffer();
    const timeMs = performance.now() - start;
    const text = new TextDecoder('utf-8').decode(buffer);

    const responseHeaders: ResponseHeader[] = [];
    res.headers.forEach((value, key) => responseHeaders.push({ key, value }));

    return {
      ok: true,
      response: {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: responseHeaders,
        body: text,
        contentType: res.headers.get('content-type') ?? '',
        timeMs,
        sizeBytes: buffer.byteLength,
        redirected: res.redirected,
        finalUrl: res.url,
      },
    };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  } finally {
    clearTimeout(timer);
  }
}
