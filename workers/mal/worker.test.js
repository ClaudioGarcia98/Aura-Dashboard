// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { handleRequest, resetWorkerState } from './worker.js';

const origin = 'https://claudiogarcia98.github.io';
const request = (path = '/animelist/alice/load.json?offset=0&status=1', options = {}) => new Request(`https://relay.example${path}`, { headers: { Origin: origin, ...options.headers }, ...options });
const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
const item = id => ({ anime_id: id, anime_title: `Show ${id}`, status: 1, tags: 'omit this field' });
beforeEach(() => { resetWorkerState(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('provides a health check without contacting MAL', async () => {
    const fetcher = vi.fn();
    const result = await handleRequest(request('/'), { fetcher });
    expect((await result.json()).status).toBe('ok');
    expect(fetcher).not.toHaveBeenCalled();
});

it('fetches only the fixed MAL endpoint and returns sanitized fields with correct CORS', async () => {
    const fetcher = vi.fn(async () => json([item(7)]));
    const result = await handleRequest(request(), { fetcher });
    expect(result.status).toBe(200);
    expect(result.headers.get('Access-Control-Allow-Origin')).toBe(origin);
    expect(result.headers.get('Access-Control-Expose-Headers')).toContain('X-Aura-Cache');
    expect(result.headers.get('Set-Cookie')).toBeNull();
    expect(fetcher).toHaveBeenCalledWith('https://myanimelist.net/animelist/alice/load.json?offset=0&status=1', expect.objectContaining({ redirect: 'manual' }));
    const data = await result.json();
    expect(data[0].anime_id).toBe(7);
    expect(data[0].tags).toBeUndefined();
});

it.each([
    '/?url=https://example.org', '/animelist/alice/load.json?status=2',
    '/animelist/alice/load.json?offset=-1', '/animelist/alice/load.json?offset=1',
    '/animelist/alice/load.json?offset=30000', '/animelist/alice/load.json?offset=0&offset=300',
    '/animelist/alice/load.json?url=https://example.org', '/animelist/a%2Fb/load.json',
])('rejects arbitrary targets and invalid pagination: %s', async path => {
    const fetcher = vi.fn();
    const result = await handleRequest(request(path), { fetcher });
    expect(result.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
});

it('rejects unrelated browser origins and writes before contacting upstream', async () => {
    const fetcher = vi.fn();
    const denied = await handleRequest(request(undefined, { headers: { Origin: 'https://unrelated.example' } }), { fetcher });
    expect(denied.status).toBe(403);
    expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect((await handleRequest(request(undefined, { method: 'POST' }), { fetcher })).status).toBe(405);
    expect(fetcher).not.toHaveBeenCalled();
});

it('supports a browser preflight without an upstream request', async () => {
    const fetcher = vi.fn();
    const result = await handleRequest(request(undefined, { method: 'OPTIONS' }), { fetcher });
    expect(result.status).toBe(204);
    expect(result.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(fetcher).not.toHaveBeenCalled();
});

it('keeps usernames and page offsets separate in the cache', async () => {
    const entries = new Map();
    const cache = {
        match: vi.fn(async key => entries.get(key.url)?.clone()),
        put: vi.fn(async (key, value) => entries.set(key.url, value)),
    };
    const fetcher = vi.fn(async url => json([item(url.includes('/bob/') ? 2 : url.includes('offset=300') ? 3 : 1)]));
    const load = path => handleRequest(request(path), { cache, fetcher });
    expect((await (await load('/animelist/alice/load.json')).json())[0].anime_id).toBe(1);
    expect((await (await load('/animelist/bob/load.json')).json())[0].anime_id).toBe(2);
    expect((await (await load('/animelist/alice/load.json?offset=300')).json())[0].anime_id).toBe(3);
    expect((await load('/animelist/ALICE/load.json?offset=0')).headers.get('X-Aura-Cache')).toBe('HIT');
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(entries.size).toBe(3);
});

it.each([
    [],
    { error: 'Private' },
    [{ anime_id: 'bad', anime_title: 'Malformed' }],
    [{ ...item(1), status: 2 }],
    [item(1), item(1)],
    [{ ...item(1), anime_score_val: 11 }],
    [{ ...item(1), num_watched_episodes: -1 }],
])('handles empty and malformed upstream lists without inventing success', async raw => {
    const cache = { match: vi.fn(), put: vi.fn() };
    const result = await handleRequest(request(), { fetcher: async () => json(raw), cache });
    expect(result.status).toBe(Array.isArray(raw) && raw.length === 0 ? 200 : 502);
    expect(cache.put).toHaveBeenCalledTimes(Array.isArray(raw) && raw.length === 0 ? 1 : 0);
});

it('does not cache upstream failures or HTML challenge pages', async () => {
    const cache = { match: vi.fn(), put: vi.fn() };
    for (const response of [new Response('not found', { status: 404 }), new Response('blocked', { status: 403 }), new Response('<html>Challenge</html>')]) {
        const result = await handleRequest(request(), { fetcher: async () => response, cache });
        expect([404, 502]).toContain(result.status);
    }
    expect(cache.put).not.toHaveBeenCalled();
});

it('still serves a valid response if cache access fails', async () => {
    const cache = { match: vi.fn().mockRejectedValue(new Error('Cache unavailable')), put: vi.fn().mockRejectedValue(new Error('Cache unavailable')) };
    expect((await handleRequest(request(), { cache, fetcher: async () => json([]) })).status).toBe(200);
});

it('works when the default Cloudflare runtime has no incoming Request.signal', async () => {
    const incoming = request();
    Object.defineProperty(incoming, 'signal', { get() { throw new Error('enable_request_signal is not enabled'); } });
    const fetcher = vi.fn(async (_url, options) => {
        expect(options.signal).toBeInstanceOf(AbortSignal);
        return json([item(1)]);
    });
    expect((await handleRequest(incoming, { fetcher })).status).toBe(200);
    expect(fetcher).toHaveBeenCalledTimes(1);
});

it('aborts a stalled upstream request within the Worker deadline without caching a failure', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn((_url, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }));
    const cache = { match: vi.fn(), put: vi.fn() };
    const pending = handleRequest(request(), { fetcher, cache });
    await vi.advanceTimersByTimeAsync(25001);
    expect((await pending).status).toBe(502);
    expect(cache.put).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
});

it('distinguishes a non-JSON upstream response from a network failure', async () => {
    const html = await handleRequest(request(), { fetcher: async () => new Response('<html>Unavailable</html>') });
    expect((await html.json()).code).toBe('UPSTREAM_NON_JSON');
    const failed = await handleRequest(request(), { fetcher: async () => { throw new Error('Connection lost'); } });
    expect((await failed.json()).code).toBe('UPSTREAM_FETCH_FAILED');
    expect(console.error).toHaveBeenCalledWith('MAL connection failed:', 'Error', 'Connection lost');
});

it('reports upstream redirects without following them to another destination', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 302, headers: { Location: 'https://other.example' } }));
    const result = await handleRequest(request(), { fetcher });
    expect((await result.json()).code).toBe('UPSTREAM_REDIRECT');
    expect(fetcher).toHaveBeenCalledTimes(1);
});

it('enforces Cloudflare rate-limiter binding and fails closed if the limiter throws', async () => {
    const fetcher = vi.fn(async () => json([item(1)]));
    const limited = await handleRequest(request(), { fetcher, env: { RATE_LIMITER: { limit: async () => ({ success: false }) } } });
    expect(limited.status).toBe(429);
    expect(limited.headers.get('Retry-After')).toBe('60');
    expect((await limited.json()).code).toBe('RATE_LIMITED');

    const broken = await handleRequest(request(), { fetcher, env: { RATE_LIMITER: { limit: async () => { throw new Error('Binding failed'); } } } });
    expect(broken.status).toBe(503);
    expect((await broken.json()).code).toBe('LIMITER_UNAVAILABLE');
    expect(fetcher).not.toHaveBeenCalled();
});

it('enforces per-IP memory rate limiting when no binding is configured', async () => {
    const fetcher = vi.fn(async () => json([item(1)]));
    const ipReq = () => request('/animelist/alice/load.json?offset=0&status=1', { headers: { 'CF-Connecting-IP': '203.0.113.10' } });
    for (let i = 0; i < 30; i++) {
        expect((await handleRequest(ipReq(), { fetcher })).status).toBe(200);
    }
    const blocked = await handleRequest(ipReq(), { fetcher });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('60');
});

it('rejects oversized upstream responses before parsing or caching', async () => {
    const cache = { match: vi.fn(), put: vi.fn() };
    const oversized = new Response('x'.repeat(1048580), { headers: { 'Content-Type': 'application/json' } });
    const result = await handleRequest(request(), { fetcher: async () => oversized, cache });
    expect(result.status).toBe(502);
    expect((await result.json()).code).toBe('UPSTREAM_TOO_LARGE');
    expect(cache.put).not.toHaveBeenCalled();
});

it('coalesces concurrent cache-miss requests for the same username and page', async () => {
    let resolveUpstream;
    const fetcher = vi.fn(() => new Promise(resolve => { resolveUpstream = resolve; }));
    const p1 = handleRequest(request('/animelist/shared/load.json?offset=0&status=1'), { fetcher });
    const p2 = handleRequest(request('/animelist/shared/load.json?offset=0&status=1'), { fetcher });
    await Promise.resolve();
    await Promise.resolve();
    resolveUpstream(json([item(55)]));
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect((await r1.json())[0].anime_id).toBe(55);
    expect((await r2.json())[0].anime_id).toBe(55);
    expect(fetcher).toHaveBeenCalledTimes(1);
});
