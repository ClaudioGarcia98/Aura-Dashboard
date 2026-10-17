// Paste this entire file into the Cloudflare Worker editor, or deploy via `npx wrangler deploy`.
const DEFAULT_SITE_ORIGIN = 'https://claudiogarcia98.github.io';
const CACHE_SECONDS = 300;
const MAX_BODY_BYTES = 1048576; // 1 MB
const RATE_WINDOW_MS = 60000;
const RATE_MAX_REQUESTS = 30;

const clientHits = new Map();
const inflight = new Map();

export function resetWorkerState() {
    clientHits.clear();
    inflight.clear();
}

function allowedOrigin(origin, siteOrigin = DEFAULT_SITE_ORIGIN) {
    if (!origin || origin === siteOrigin) return true;
    try {
        const url = new URL(origin);
        return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    } catch { return false; }
}

function reply(data, status, origin, extra = {}, siteOrigin = DEFAULT_SITE_ORIGIN) {
    const cors = origin && allowedOrigin(origin, siteOrigin)
        ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Expose-Headers': 'X-Aura-Cache, Retry-After' }
        : {};
    return new Response(data === null ? null : JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Vary': 'Origin',
            ...cors,
            ...extra,
        },
    });
}

function checkMemoryRateLimit(key, now = Date.now()) {
    if (clientHits.size > 5000) {
        for (const [k, entry] of clientHits) if (now - entry.start >= RATE_WINDOW_MS) clientHits.delete(k);
    }
    const entry = clientHits.get(key);
    if (!entry || now - entry.start >= RATE_WINDOW_MS) {
        clientHits.set(key, { start: now, count: 1 });
        return true;
    }
    if (entry.count >= RATE_MAX_REQUESTS) return false;
    entry.count += 1;
    return true;
}

async function readBoundedText(response, maxBytes = MAX_BODY_BYTES) {
    const lengthHeader = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(lengthHeader) && lengthHeader > maxBytes) {
        const err = new Error('Response too large');
        err.code = 'UPSTREAM_TOO_LARGE';
        throw err;
    }
    if (!response.body?.getReader) {
        const text = await response.text();
        if (new TextEncoder().encode(text).byteLength > maxBytes) {
            const err = new Error('Response too large');
            err.code = 'UPSTREAM_TOO_LARGE';
            throw err;
        }
        return text;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let total = 0;
    let text = '';
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            total += value.byteLength;
            if (total > maxBytes) {
                await reader.cancel?.();
                const err = new Error('Response too large');
                err.code = 'UPSTREAM_TOO_LARGE';
                throw err;
            }
            text += decoder.decode(value, { stream: true });
        }
        text += decoder.decode();
        return text;
    } finally {
        reader.releaseLock?.();
    }
}

function normalizeWatchingList(raw) {
    if (!Array.isArray(raw) || raw.length > 300) return null;
    const seen = new Set();
    const items = [];
    for (const item of raw) {
        const id = Number(item?.anime_id);
        if (!item || !Number.isSafeInteger(id) || id <= 0 || id > 1000000000 || seen.has(id)) return null;
        if (typeof item.anime_title !== 'string' || !item.anime_title.trim() || item.anime_title.length > 512) return null;
        if (item.status !== undefined && Number(item.status) !== 1) return null;
        const watched = Number(item.num_watched_episodes ?? 0);
        if (!Number.isSafeInteger(watched) || watched < 0 || watched > 100000) return null;
        const rawScore = item.anime_score_val;
        const numericScore = Number(rawScore);
        const score = rawScore === undefined || rawScore === null || rawScore === '' || rawScore === 'N/A'
            ? 'N/A'
            : (Number.isFinite(numericScore) && numericScore >= 0 && numericScore <= 10 ? numericScore : null);
        if (score === null) return null;
        const imagePath = typeof item.anime_image_path === 'string' && item.anime_image_path.length <= 1024
            ? item.anime_image_path
            : (item.anime_image_path === undefined || item.anime_image_path === null ? '' : null);
        if (imagePath === null) return null;
        seen.add(id);
        items.push({
            anime_id: id,
            anime_title: item.anime_title.trim(),
            anime_url: `/anime/${id}`,
            anime_image_path: imagePath,
            anime_score_val: score,
            num_watched_episodes: watched,
        });
    }
    return items;
}

export async function handleRequest(request, { fetcher = fetch, cache = globalThis.caches?.default, env = {} } = {}) {
    const siteOrigin = env?.SITE_ORIGIN || DEFAULT_SITE_ORIGIN;
    const origin = request.headers.get('Origin');
    if (!allowedOrigin(origin, siteOrigin)) return reply({ error: 'Origin not allowed' }, 403, null, {}, siteOrigin);
    if (!['GET', 'OPTIONS'].includes(request.method)) return reply({ error: 'Use GET' }, 405, origin, { Allow: 'GET, OPTIONS' }, siteOrigin);

    const url = new URL(request.url);
    if (url.pathname === '/' && !url.search && request.method === 'GET') {
        return reply({ service: 'Aura MAL connection', version: 4, status: 'ok' }, 200, origin, {}, siteOrigin);
    }
    const match = url.pathname.match(/^\/animelist\/([a-z\d_-]{1,32})\/load\.json$/i);
    const offsets = url.searchParams.getAll('offset');
    const statuses = url.searchParams.getAll('status');
    const offset = offsets[0] ?? '0';
    if (!match || !/^\d+$/.test(offset) || Number(offset) > 29700 || Number(offset) % 300 !== 0
        || offsets.length > 1 || statuses.length > 1 || (statuses[0] ?? '1') !== '1'
        || [...url.searchParams.keys()].some(key => !['offset', 'status'].includes(key))) {
        return reply({ error: 'Invalid watching-list request' }, 400, origin, {}, siteOrigin);
    }
    if (request.method === 'OPTIONS') {
        return reply(null, 204, origin, {
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
            'Access-Control-Max-Age': '86400',
        }, siteOrigin);
    }

    const clientIp = request.headers.get('CF-Connecting-IP');
    const rateKey = clientIp || 'default';
    if (env?.RATE_LIMITER) {
        try {
            const outcome = await env.RATE_LIMITER.limit({ key: rateKey });
            if (!outcome?.success) {
                return reply({ error: 'Rate limit exceeded. Please wait before retrying.', code: 'RATE_LIMITED', retryAfter: 60 }, 429, origin, { 'Retry-After': '60' }, siteOrigin);
            }
        } catch {
            return reply({ error: 'Rate limiter unavailable', code: 'LIMITER_UNAVAILABLE' }, 503, origin, {}, siteOrigin);
        }
    } else if (clientIp && !checkMemoryRateLimit(clientIp)) {
        return reply({ error: 'Rate limit exceeded. Please wait before retrying.', code: 'RATE_LIMITED', retryAfter: 60 }, 429, origin, { 'Retry-After': '60' }, siteOrigin);
    }

    const username = match[1].toLowerCase();
    const path = `/animelist/${username}/load.json?offset=${Number(offset)}&status=1`;
    const cacheKey = new Request(url.origin + path);
    const bypassCache = /(?:^|,)\s*(?:no-cache|no-store)\s*(?:,|$)/i.test(request.headers.get('Cache-Control') || '');
    try {
        const hit = !bypassCache && await cache?.match(cacheKey);
        if (hit) return reply(await hit.json(), 200, origin, { 'X-Aura-Cache': 'HIT' }, siteOrigin);
    } catch { /* A cache failure must not prevent a live lookup. */ }

    // A refresh must not join an older ordinary lookup already in progress.
    const inflightKey = `${bypassCache ? 'live' : 'cached'}:${path}`;
    let pending = inflight.get(inflightKey);
    if (!pending) {
        pending = (async () => {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 25000);
            try {
                const upstream = await fetcher(`https://myanimelist.net${path}`, {
                    method: 'GET',
                    redirect: 'manual',
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'Cache-Control': 'no-cache',
                        Referer: 'https://myanimelist.net/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    },
                });
                if (upstream.status >= 300 && upstream.status < 400) {
                    return { data: { error: 'MyAnimeList redirected the server request', code: 'UPSTREAM_REDIRECT' }, status: 502 };
                }
                if (!upstream.ok) {
                    return {
                        data: { error: upstream.status === 404 ? 'Username not found' : 'MyAnimeList could not provide this public list' },
                        status: upstream.status === 404 ? 404 : 502,
                    };
                }
                const body = await readBoundedText(upstream);
                let raw;
                try { raw = JSON.parse(body); }
                catch {
                    return { data: { error: 'MyAnimeList returned a non-JSON page', code: 'UPSTREAM_NON_JSON' }, status: 502 };
                }
                const items = normalizeWatchingList(raw);
                if (!items) {
                    return { data: { error: 'MyAnimeList returned an invalid watching list', code: 'UPSTREAM_INVALID_LIST' }, status: 502 };
                }
                if (cache) {
                    try {
                        await cache.put(cacheKey, new Response(JSON.stringify(items), {
                            headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
                        }));
                    } catch { /* Cache writes are optional. */ }
                }
                return { data: items, status: 200, extra: { 'X-Aura-Cache': 'MISS' } };
            } catch (error) {
                if (error?.code === 'UPSTREAM_TOO_LARGE') {
                    return { data: { error: 'MyAnimeList response exceeded size limit', code: 'UPSTREAM_TOO_LARGE' }, status: 502 };
                }
                console.error('MAL connection failed:', error.name, error.message);
                return {
                    data: { error: 'MyAnimeList is unavailable or the request timed out', code: controller.signal.aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_FETCH_FAILED' },
                    status: 502,
                };
            } finally { clearTimeout(timer); }
        })();
        inflight.set(inflightKey, pending);
    }

    try {
        const result = await pending;
        return reply(result.data, result.status, origin, result.extra, siteOrigin);
    } finally {
        inflight.delete(inflightKey);
    }
}

export default { fetch: (request, env) => handleRequest(request, { env }) };
