import { it, expect, vi, afterEach } from 'vitest';
import { fetchJson } from './http';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('bounds a stalled response body and aborts the underlying request', async () => {
    vi.useFakeTimers();
    let signal;
    vi.stubGlobal('fetch', vi.fn((_url, options) => { signal = options.signal; return Promise.resolve({ ok: true, json: () => new Promise(() => {}) }); }));
    const result = expect(fetchJson('https://example.com', {}, 50)).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(50);
    await result;
    expect(signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
});
it('cancels requests when their caller is aborted', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    const controller = new AbortController();
    const result = expect(fetchJson('https://example.com', { signal: controller.signal })).rejects.toThrow();
    controller.abort();
    await result;
});
it('rejects unsuccessful HTTP responses and clears its deadline', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 429 }));
    await expect(fetchJson('https://example.com')).rejects.toThrow('429');
    expect(vi.getTimerCount()).toBe(0);
});
