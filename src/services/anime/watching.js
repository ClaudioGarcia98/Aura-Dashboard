import { MAL_RELAY_BASE, ALLORIGINS_BASE, ALLORIGINS_RAW_BASE, CODETABS_BASE, RSS2JSON_BASE, FEED2JSON_BASE } from '../api';
import { fetchJson } from '../http';
import { safeStorage } from '../../utils/storage';
import { httpUrl } from '../../utils/urls';
import { parseMALItems, parseMALRssItems } from './parsers';

const memory = new Map();
export function clearMalMemoryCache() { memory.clear(); }

async function firstSuccessful(requests, signal) {
    const group = new AbortController();
    const abort = () => group.abort(signal?.reason);
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    try { return await Promise.any(requests.map(request => request(group.signal))); }
    finally { group.abort(); signal?.removeEventListener('abort', abort); }
}

export async function fetchUserWatchingList(username, { signal, force = false } = {}) {
    if (signal?.aborted) throw signal.reason;
    if (typeof username !== 'string' || !username.trim()) return [];
    const user = username.trim().toLowerCase();
    const custom = safeStorage.getItem('dash_mal_proxy')?.trim();
    const cacheKey = `${user}:${custom || ''}`;
    const cached = memory.get(cacheKey);
    if (!force && cached && Date.now() - cached.ts < (cached.data.partial ? 30000 : 300000)) return cached.data;
    const encoded = encodeURIComponent(user);
    const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
    const local = ['localhost', '127.0.0.1'].includes(hostname);
    const path = offset => `/animelist/${encoded}/load.json?offset=${offset}&status=1`;
    const malUrl = offset => `https://myanimelist.net${path(offset)}`;

    const list = async (makeUrl, unwrap = value => value, requestSignal = signal, timeout = 15000) => {
        const items = [];
        for (let page = 0; page < 100; page++) {
            const raw = unwrap(await fetchJson(makeUrl(page * 300), { signal: requestSignal, cache: 'no-store' }, timeout));
            if (!Array.isArray(raw)) throw new Error('Invalid MAL response');
            const parsed = parseMALItems(raw);
            if (parsed.length !== raw.length) throw new Error('Malformed watching-list items');
            items.push(...parsed);
            if (raw.length < 300) return items;
        }
        throw new Error('Watching-list pagination limit exceeded');
    };
    let data;
    if (custom) {
        if (!httpUrl(custom)) throw new Error('Invalid custom proxy URL');
        const base = /[/?=]$/.test(custom) ? custom : `${custom}/`;
        try { data = await list(offset => base.includes('?') ? base + encodeURIComponent(malUrl(offset)) : base + malUrl(offset), undefined, signal, 25000); }
        catch (error) { if (signal?.aborted) throw error; }
    }
    if (!data && local) {
        // MAL can take over 15 seconds to answer a cold connection through the local proxy.
        try { data = await list(offset => `/api/mal${path(offset)}`, undefined, signal, 25000); }
        catch (error) { if (signal?.aborted) throw error; }
    }
    if (!data && !local) {
        // GitHub Pages has no /api server. Use our MAL-only Worker for any username.
        try { data = await list(offset => `${MAL_RELAY_BASE}${path(offset)}`, undefined, signal, 30000); }
        catch (error) { if (signal?.aborted) throw error; }
    }
    if (!data) {
        try {
            data = await firstSuccessful([
                s => list(offset => ALLORIGINS_BASE + encodeURIComponent(malUrl(offset)), wrapper => {
                    if (wrapper?.status?.http_code && wrapper.status.http_code !== 200) throw new Error('MAL proxy failed');
                    return typeof wrapper?.contents === 'string' ? JSON.parse(wrapper.contents) : wrapper?.contents;
                }, s),
                s => list(offset => ALLORIGINS_RAW_BASE + encodeURIComponent(malUrl(offset)), undefined, s),
                s => list(offset => CODETABS_BASE + encodeURIComponent(malUrl(offset)), undefined, s),
            ], signal);
        } catch (error) {
            if (signal?.aborted) throw error;
            const rss = `https://myanimelist.net/rss.php?type=rw&u=${encoded}&limit=100`;
            // RSS is an explicitly partial fallback, never a competing authoritative list.
            data = await firstSuccessful([
                async s => {
                    const json = await fetchJson(RSS2JSON_BASE + encodeURIComponent(rss), { signal: s });
                    if (json.status !== 'ok' || !Array.isArray(json.items)) throw new Error('Invalid RSS feed');
                    return parseMALRssItems(json.items);
                },
                async s => {
                    const json = await fetchJson(FEED2JSON_BASE + encodeURIComponent(rss), { signal: s });
                    if (!Array.isArray(json.items)) throw new Error('Invalid RSS feed');
                    return parseMALRssItems(json.items);
                },
            ], signal);
            Object.defineProperty(data, 'partial', { value: true });
        }
    }
    if (signal?.aborted) throw signal.reason;
    memory.set(cacheKey, { data, ts: Date.now() });
    return data;
}
