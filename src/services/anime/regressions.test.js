import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLocalDayRange } from './time';
import { fetchDaySchedule, getScheduleCache } from './schedule';
import { fetchUserWatchingList, clearMalMemoryCache } from './watching';
import { parseAniListSchedule } from './parsers';
import { SCHEDULE_CACHE_KEY } from '../api';
import { MAL_RELAY_BASE } from '../api';

beforeEach(() => { localStorage.clear(); clearMalMemoryCache(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const response = json => ({ ok: true, json: async () => json });
const media = id => ({ airingAt: 1792159200, media: { id, idMal: id, title: { english: `Show ${id}` } } });

it.each([
    ['2026-03-29T12:00:00Z', '2026-03-29T00:00:00.000Z', '2026-03-29T23:00:00.000Z', 23],
    ['2026-10-25T12:00:00Z', '2026-10-24T23:00:00.000Z', '2026-10-26T00:00:00.000Z', 25],
])('uses actual local midnight boundaries across DST: %s', (now, start, end, hours) => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(now));
    const range = getLocalDayRange('sunday');
    expect(new Date(range.startUtcSec * 1000).toISOString()).toBe(start);
    expect(new Date(range.endUtcSec * 1000).toISOString()).toBe(end);
    expect(range.endUtcSec - range.startUtcSec).toBe(hours * 3600);
});

it.each(['null', '[]', '"invalid"'])('recovers from valid JSON with an invalid cache shape: %s', async raw => {
    localStorage.setItem(SCHEDULE_CACHE_KEY, raw);
    fetch.mockResolvedValue(response({ data: { Page: { airingSchedules: [] } } }));
    await expect(fetchDaySchedule('friday')).resolves.toEqual([]);
    expect(getScheduleCache().friday.data).toEqual([]);
});
it('reads all AniList pages and caches an authoritative empty response', async () => {
    fetch.mockImplementation((_url, options) => {
        const page = JSON.parse(options.body).variables.page;
        return Promise.resolve(response({ data: { Page: { airingSchedules: [media(page)], pageInfo: { hasNextPage: page === 1 } } } }));
    });
    expect(await fetchDaySchedule('friday')).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
});
it('keeps AniList-only identifiers separate from MAL identifiers', () => {
    const items = parseAniListSchedule([media(7), { ...media(7), media: { id: 7, title: { english: 'No MAL id' } } }], 'friday');
    expect(items.map(item => item.mal_id)).toEqual([7, 'anilist:7']);
});
it('returns a live empty owner list without resurrecting a bundled snapshot', async () => {
    fetch.mockImplementation(async url => {
        if (url.startsWith('/api/mal/')) return response([]);
        throw new Error('Unavailable');
    });
    expect(await fetchUserWatchingList('claclo98')).toEqual([]);
});
it('paginates complete MAL lists before returning them', async () => {
    fetch.mockImplementation(async url => {
        if (!url.startsWith('/api/mal/')) throw new Error('Unavailable');
        return response(url.includes('offset=0&') ? Array.from({ length: 300 }, (_, i) => ({ anime_id: i + 1, anime_title: `Show ${i}` })) : [{ anime_id: 301, anime_title: 'Last page' }]);
    });
    expect(await fetchUserWatchingList('large')).toHaveLength(301);
});

it('requests live relay pages on the first sync and bypasses memory on a single refresh', async () => {
    vi.stubGlobal('window', { location: { hostname: 'claudiogarcia98.github.io' } });
    fetch.mockResolvedValueOnce(response([{ anime_id: 1, anime_title: 'Existing show' }]))
        .mockResolvedValueOnce(response([{ anime_id: 1, anime_title: 'Existing show' }, { anime_id: 2, anime_title: 'New show' }]));
    expect(await fetchUserWatchingList('alice')).toHaveLength(1);
    expect(await fetchUserWatchingList('alice')).toHaveLength(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(await fetchUserWatchingList('alice', { force: true })).toHaveLength(2);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const [, options] of fetch.mock.calls) {
        expect(options.cache).toBe('no-store');
        expect(options.headers['Cache-Control']).toBe('no-cache');
    }
});

it('allows the local proxy to finish a cold connection taking over 15 seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('window', { location: { hostname: '127.0.0.1' } });
    fetch.mockImplementation(url => {
        if (url.startsWith('/api/mal/')) return new Promise(resolve => setTimeout(() => resolve(response([{ anime_id: 9, anime_title: 'Local full list' }])), 16000));
        return Promise.reject(new Error('Unexpected fallback'));
    });
    const pending = fetchUserWatchingList('local');
    await vi.advanceTimersByTimeAsync(16000);
    expect((await pending)[0].mal_id).toBe(9);
    expect(fetch).toHaveBeenCalledTimes(1);
});

it('uses the dedicated relay on GitHub Pages for each entered username', async () => {
    vi.stubGlobal('window', { location: { hostname: 'claudiogarcia98.github.io' } });
    fetch.mockImplementation(async url => {
        if (!url.startsWith(MAL_RELAY_BASE)) throw new Error('Public proxies unavailable');
        return response([{ anime_id: url.includes('/alice/') ? 11 : 22, anime_title: 'Full public list' }]);
    });
    expect((await fetchUserWatchingList('alice'))[0].mal_id).toBe(11);
    expect((await fetchUserWatchingList('bob'))[0].mal_id).toBe(22);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls.every(([url]) => url.startsWith(MAL_RELAY_BASE))).toBe(true);
});

it('paginates the hosted relay and accepts an authoritative empty list', async () => {
    vi.stubGlobal('window', { location: { hostname: 'claudiogarcia98.github.io' } });
    fetch.mockImplementation(async url => {
        if (!url.startsWith(MAL_RELAY_BASE)) throw new Error('Unexpected fallback');
        return response(url.includes('offset=0&') && !url.includes('/empty/')
            ? Array.from({ length: 300 }, (_, i) => ({ anime_id: i + 1, anime_title: `Show ${i}` })) : []);
    });
    expect(await fetchUserWatchingList('large')).toHaveLength(300);
    const empty = await fetchUserWatchingList('empty');
    expect(empty).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(3);
});
