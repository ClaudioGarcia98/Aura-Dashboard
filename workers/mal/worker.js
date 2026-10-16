// Paste this entire file into the Cloudflare Worker editor, then Deploy.
const SITE_ORIGIN = 'https://claudiogarcia98.github.io';
const CACHE_SECONDS = 300;

function allowedOrigin(origin) {
    if (!origin || origin === SITE_ORIGIN) return true;
    try {
        const url = new URL(origin);
        return url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname);
    } catch { return false; }
}

function reply(data, status, origin, extra = {}) {
    return new Response(data === null ? null : JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Vary': 'Origin',
            ...(origin && allowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
            ...extra,
        },
    });
}

export async function handleRequest(request, { fetcher = fetch, cache = globalThis.caches?.default } = {}) {
    const origin = request.headers.get('Origin');
    if (!allowedOrigin(origin)) return reply({ error: 'Origin not allowed' }, 403, null);
    if (!['GET', 'OPTIONS'].includes(request.method)) return reply({ error: 'Use GET' }, 405, origin, { Allow: 'GET, OPTIONS' });

    const url = new URL(request.url);
    if (url.pathname === '/' && !url.search && request.method === 'GET') {
        return reply({ service: 'Aura MAL connection', version: 3, status: 'ok' }, 200, origin);
    }
    const match = url.pathname.match(/^\/animelist\/([a-z\d_-]{1,32})\/load\.json$/i);
    const offsets = url.searchParams.getAll('offset');
    const statuses = url.searchParams.getAll('status');
    const offset = offsets[0] ?? '0';
    if (!match || !/^\d+$/.test(offset) || Number(offset) > 29700 || Number(offset) % 300 !== 0
        || offsets.length > 1 || statuses.length > 1 || (statuses[0] ?? '1') !== '1'
        || [...url.searchParams.keys()].some(key => !['offset', 'status'].includes(key))) {
        return reply({ error: 'Invalid watching-list request' }, 400, origin);
    }
    if (request.method === 'OPTIONS') {
        return reply(null, 204, origin, {
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
            'Access-Control-Max-Age': '86400',
        });
    }

    const username = match[1].toLowerCase();
    const path = `/animelist/${username}/load.json?offset=${Number(offset)}&status=1`;
    const cacheKey = new Request(url.origin + path);
    try {
        const hit = await cache?.match(cacheKey);
        if (hit) return reply(await hit.json(), 200, origin, { 'X-Aura-Cache': 'HIT' });
    } catch { /* A cache failure must not prevent a live lookup. */ }

    // Incoming Request.signal needs an optional Cloudflare compatibility flag.
    // An independent controller works in the dashboard's default runtime too.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
        const upstream = await fetcher(`https://myanimelist.net${path}`, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                Referer: 'https://myanimelist.net/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
        });
        if (upstream.status >= 300 && upstream.status < 400) {
            return reply({ error: 'MyAnimeList redirected the server request', code: 'UPSTREAM_REDIRECT' }, 502, origin);
        }
        if (!upstream.ok) {
            return reply({ error: upstream.status === 404 ? 'Username not found' : 'MyAnimeList could not provide this public list' }, upstream.status === 404 ? 404 : 502, origin);
        }
        const body = await upstream.text();
        let raw;
        try { raw = JSON.parse(body); }
        catch {
            return reply({ error: 'MyAnimeList returned a non-JSON page', code: 'UPSTREAM_NON_JSON' }, 502, origin);
        }
        if (!Array.isArray(raw) || raw.length > 300 || raw.some(item => !item
            || !Number.isSafeInteger(Number(item.anime_id)) || Number(item.anime_id) <= 0
            || typeof item.anime_title !== 'string' || !item.anime_title.trim()
            || (item.status !== undefined && Number(item.status) !== 1))) {
            return reply({ error: 'MyAnimeList returned an invalid watching list' }, 502, origin);
        }
        // Return only dashboard fields, never upstream cookies or unrelated list metadata.
        const items = raw.map(item => ({
            anime_id: Number(item.anime_id), anime_title: item.anime_title,
            anime_url: `/anime/${Number(item.anime_id)}`,
            anime_image_path: typeof item.anime_image_path === 'string' ? item.anime_image_path : '',
            anime_score_val: item.anime_score_val ?? 'N/A',
            num_watched_episodes: item.num_watched_episodes ?? 0,
        }));
        if (cache) {
            try {
                await cache.put(cacheKey, new Response(JSON.stringify(items), {
                    headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
                }));
            } catch { /* Cache writes are optional. */ }
        }
        return reply(items, 200, origin, { 'X-Aura-Cache': 'MISS' });
    } catch (error) {
        console.error('MAL connection failed:', error.name, error.message);
        return reply({ error: 'MyAnimeList is unavailable or the request timed out', code: controller.signal.aborted ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_FETCH_FAILED' }, 502, origin);
    } finally { clearTimeout(timer); }
}

export default { fetch: request => handleRequest(request) };
