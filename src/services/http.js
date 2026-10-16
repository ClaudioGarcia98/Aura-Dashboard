export async function fetchJson(url, { signal, ...options } = {}, timeout = 6000) {
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    let rejectAbort;
    const interrupted = new Promise((_, reject) => { rejectAbort = reject; });
    const onAbort = () => rejectAbort(controller.signal.reason || new DOMException('Aborted', 'AbortError'));
    controller.signal.addEventListener('abort', onAbort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('Request timed out')), timeout);
    try {
        if (controller.signal.aborted) onAbort();
        return await Promise.race([
            interrupted,
            (async () => {
                if (controller.signal.aborted) throw controller.signal.reason;
                const response = await fetch(url, { ...options, signal: controller.signal });
                if (!response?.ok) {
                    const error = new Error(`HTTP ${response?.status ?? 'invalid response'}`);
                    error.status = response?.status;
                    const retryAfter = Number(response?.headers?.get?.('Retry-After'));
                    if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfter = retryAfter;
                    throw error;
                }
                return response.json();
            })(),
        ]);
    } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', abort);
        controller.signal.removeEventListener('abort', onAbort);
    }
}
