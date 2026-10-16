import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLocalDayRange } from './time';
import { fetchDaySchedule, getScheduleCache } from './schedule';
import { fetchUserWatchingList, clearMalMemoryCache } from './watching';
import { parseAniListSchedule } from './parsers';
import { SCHEDULE_CACHE_KEY } from '../api';

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
it('normalizes two Japan-local schedule days into one Portugal-local day', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-16T12:00:00Z'));
    fetch.mockImplementation(async url => {
        if (!url.includes('/schedules?')) throw new Error('AniList unavailable');
        const friday = url.includes('filter=friday');
        return response({ data: [
            { mal_id: friday ? 1 : 3, title: 'Midnight', broadcast: { time: '00:00' } },
            { mal_id: friday ? 2 : 4, title: 'Noon', broadcast: { time: '12:00' } },
        ] });
    });
    const items = await fetchDaySchedule('friday');
    expect(items.map(item => item.mal_id)).toEqual([2, 3]);
    expect(items.every(item => Number.isFinite(item.airingAt))).toBe(true);
});
it('prefers a complete JSON list even when an RSS feed could answer earlier', async () => {
    fetch.mockImplementation(async url => {
        if (url.includes('allorigins.win/raw')) return response([{ anime_id: 42, anime_title: 'Still watching' }]);
        if (url.includes('rss2json')) return response({ status: 'ok', items: [] });
        throw new Error('Unavailable');
    });
    const items = await fetchUserWatchingList('audit');
    expect(items[0].mal_id).toBe(42);
    expect(fetch.mock.calls.some(([url]) => url.includes('rss2json'))).toBe(false);
});
it('returns a live empty owner list without resurrecting a bundled snapshot', async () => {
    fetch.mockImplementation(async url => {
        if (url.includes('allorigins.win/raw')) return response([]);
        throw new Error('Unavailable');
    });
    expect(await fetchUserWatchingList('claclo98')).toEqual([]);
});
it('paginates complete MAL lists before returning them', async () => {
    fetch.mockImplementation(async url => {
        if (!url.includes('allorigins.win/raw')) throw new Error('Unavailable');
        const target = decodeURIComponent(url.split('?url=')[1]);
        return response(target.includes('offset=0&') ? Array.from({ length: 300 }, (_, i) => ({ anime_id: i + 1, anime_title: `Show ${i}` })) : [{ anime_id: 301, anime_title: 'Last page' }]);
    });
    expect(await fetchUserWatchingList('large')).toHaveLength(301);
});

it('waits for a slow full-list response instead of prematurely falling back to RSS', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(url => {
        if (url.includes('allorigins.win/raw')) return new Promise(resolve => setTimeout(() => resolve(response([{ anime_id: 42, anime_title: 'Complete list' }])), 12000));
        return Promise.reject(new Error('Unavailable'));
    });
    const pending = fetchUserWatchingList('slow');
    await vi.advanceTimersByTimeAsync(12000);
    const data = await pending;
    expect(data[0].mal_id).toBe(42);
    expect(data.partial).toBeUndefined();
    expect(fetch.mock.calls.some(([url]) => url.includes('rss2json'))).toBe(false);
});

it('bypasses a cached partial result on an explicit retry', async () => {
    fetch.mockImplementation(async url => {
        if (url.includes('rss2json')) return response({ status: 'ok', items: [] });
        throw new Error('Unavailable');
    });
    expect((await fetchUserWatchingList('retry')).partial).toBe(true);
    fetch.mockImplementation(async url => {
        if (url.includes('allorigins.win/raw')) return response([{ anime_id: 7, anime_title: 'Full result' }]);
        throw new Error('Unavailable');
    });
    const data = await fetchUserWatchingList('retry', { force: true });
    expect(data[0].mal_id).toBe(7);
    expect(data.partial).toBeUndefined();
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

it('expires partial results after 30 seconds so a later attempt can recover', async () => {
    vi.useFakeTimers();
    fetch.mockImplementation(async url => {
        if (url.includes('rss2json')) return response({ status: 'ok', items: [] });
        throw new Error('Unavailable');
    });
    await fetchUserWatchingList('recover');
    fetch.mockImplementation(async url => {
        if (url.includes('allorigins.win/raw')) return response([{ anime_id: 8, anime_title: 'Recovered' }]);
        throw new Error('Unavailable');
    });
    expect((await fetchUserWatchingList('recover')).partial).toBe(true);
    await vi.advanceTimersByTimeAsync(30001);
    expect((await fetchUserWatchingList('recover'))[0].mal_id).toBe(8);
});
