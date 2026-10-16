import { MAL_RELAY_BASE } from '../api';
import { fetchJson } from '../http';
import { parseMALItems } from './parsers';

const memory = new Map();
export function clearMalMemoryCache() { memory.clear(); }

export async function fetchUserWatchingList(username, { signal, force = false } = {}) {
    if (signal?.aborted) throw signal.reason;
    if (typeof username !== 'string' || !username.trim()) return [];
    const user = username.trim().toLowerCase();
    const cached = memory.get(user);
    if (!force && cached && Date.now() - cached.ts < 300000) return cached.data;
    const encoded = encodeURIComponent(user);
    const hostname = typeof window === 'undefined' ? '' : window.location.hostname;
    const local = ['localhost', '127.0.0.1'].includes(hostname);
    const base = local ? '/api/mal' : MAL_RELAY_BASE;
    const timeout = local ? 25000 : 30000;

    const items = [];
    for (let page = 0; page < 100; page++) {
        const raw = await fetchJson(`${base}/animelist/${encoded}/load.json?offset=${page * 300}&status=1`, { signal, cache: 'no-store' }, timeout);
        if (!Array.isArray(raw)) throw new Error('Invalid MAL response');
        const parsed = parseMALItems(raw);
        if (parsed.length !== raw.length) throw new Error('Malformed watching-list items');
        items.push(...parsed);
        if (raw.length < 300) {
            if (signal?.aborted) throw signal.reason;
            memory.set(user, { data: items, ts: Date.now() });
            return items;
        }
    }
    throw new Error('Watching-list pagination limit exceeded');
}
