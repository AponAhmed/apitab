import type { ApiError, RequestResult, ResponseHeader } from '@/types';
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
        : 'Network error — the host may be unreachable, the DNS lookup failed, or the request was blocked.',
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
        for (const f of req.formData) if (f.key) fd.append(f.key, f.value);
        body = fd;
        // Let the browser set the multipart boundary.
        headers.delete('content-type');
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
