import { ANILIST_GRAPHQL_ENDPOINT, SCHEDULE_CACHE_KEY } from '../api';
import { fetchJson } from '../http';
import { safeJsonParse, safeStorage } from '../../utils/storage';
import { getLocalDayRange } from './time';
import { parseAniListSchedule } from './parsers';
import { deviceTimeZone } from '../../utils/timeZone';

export function getScheduleCache(timeZone = deviceTimeZone()) {
    const cache = safeJsonParse(safeStorage.getItem(SCHEDULE_CACHE_KEY), {});
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) return {};
    return Object.fromEntries(Object.entries(cache).filter(([day, entry]) => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(day) && entry && entry.timeZone === timeZone
        && Number.isFinite(entry.ts) && Array.isArray(entry.data)
        && entry.data.every(item => item && item.mal_id && typeof item.title === 'string')));
}

export function setScheduleCache(cache, timeZone = deviceTimeZone()) {
    const entries = {};
    for (const [day, entry] of Object.entries(cache || {})) {
        if (entry && Array.isArray(entry.data)) entries[day] = { ...entry, timeZone, start: entry.start ?? getLocalDayRange(day, timeZone)?.startUtcSec };
    }
    safeStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(entries));
}

const query = `query ($start: Int, $end: Int, $page: Int) {
    Page(page: $page, perPage: 50) {
        pageInfo { hasNextPage }
        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
            airingAt episode
            media { id idMal title { romaji english native } coverImage { large medium }
                averageScore genres episodes description trailer { id site } siteUrl isAdult }
        }
    }
}`;

async function aniListSchedule(day, range, signal) {
    const items = [];
    for (let page = 1; page <= 100; page++) {
        const json = await fetchJson(ANILIST_GRAPHQL_ENDPOINT, {
            method: 'POST', signal, headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ query, variables: { start: range.startUtcSec - 1, end: range.endUtcSec, page } }),
        });
        const result = json?.data?.Page;
        if (json.errors?.length || !Array.isArray(result?.airingSchedules)) throw new Error('Invalid AniList schedule');
        items.push(...result.airingSchedules);
        if (!result.pageInfo?.hasNextPage) return parseAniListSchedule(items, day);
    }
    throw new Error('Schedule pagination limit exceeded');
}

export async function fetchDaySchedule(day, { signal, timeZone = deviceTimeZone() } = {}) {
    const range = getLocalDayRange(day, timeZone);
    if (!range) throw new Error('Invalid schedule day');
    const entry = getScheduleCache(timeZone)[day];
    const matching = entry?.start === range.startUtcSec && Array.isArray(entry.data);
    if (matching && Date.now() - entry.ts < 3600000) return entry.data;
    let data;
    try {
        data = await aniListSchedule(day, range, signal);
    } catch (error) {
        if (signal?.aborted) throw error;
        if (matching) {
            const staleData = [...entry.data];
            Object.defineProperty(staleData, 'stale', { value: true });
            Object.defineProperty(staleData, 'savedAt', { value: entry.ts });
            return staleData;
        }
        throw error;
    }
    if (signal?.aborted) throw signal.reason;
    const unique = [...new Map(data.map(item => [item.mal_id, item])).values()];
    setScheduleCache({ ...getScheduleCache(timeZone), [day]: { data: unique, ts: Date.now(), start: range.startUtcSec } }, timeZone);
    return unique;
}
