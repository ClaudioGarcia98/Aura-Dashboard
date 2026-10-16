import { JIKAN_BASE, ANILIST_GRAPHQL_ENDPOINT, SCHEDULE_CACHE_KEY } from '../api';
import { fetchJson } from '../http';
import { safeJsonParse, safeStorage } from '../../utils/storage';
import { getLocalDayRange } from './time';
import { parseAniListSchedule } from './parsers';

export function getScheduleCache() {
    const cache = safeJsonParse(safeStorage.getItem(SCHEDULE_CACHE_KEY), {});
    if (!cache || typeof cache !== 'object' || Array.isArray(cache)) return {};
    return Object.fromEntries(Object.entries(cache).filter(([day, entry]) => getLocalDayRange(day) && entry
        && Number.isFinite(entry.ts) && Array.isArray(entry.data)
        && entry.data.every(item => item && item.mal_id && typeof item.title === 'string')));
}

export function setScheduleCache(cache) {
    const entries = {};
    for (const [day, entry] of Object.entries(cache || {})) {
        if (entry && Array.isArray(entry.data)) entries[day] = { ...entry, start: entry.start ?? getLocalDayRange(day)?.startUtcSec };
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

async function jikanSchedule(range, signal) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const items = [];
    // A Portugal-local day spans parts of two Japan-local days.
    const firstJstMidnight = Math.floor((range.startUtcSec + 9 * 3600) / 86400) * 86400 - 9 * 3600;
    for (let midnight = firstJstMidnight; midnight < range.endUtcSec; midnight += 86400) {
        const weekday = days[new Date((midnight + 9 * 3600) * 1000).getUTCDay()];
        for (let page = 1; page <= 100; page++) {
            const json = await fetchJson(`${JIKAN_BASE}/schedules?filter=${weekday}&page=${page}`, { signal });
            if (!Array.isArray(json.data)) throw new Error('Invalid Jikan schedule');
            for (const item of json.data) {
                if (!item || !item.mal_id) continue;
                const match = item.broadcast?.time?.match(/^(\d{2}):(\d{2})$/);
                if (!match) continue; // No reliable local broadcast day without a time.
                const airingAt = midnight + Number(match[1]) * 3600 + Number(match[2]) * 60;
                if (airingAt >= range.startUtcSec && airingAt < range.endUtcSec) items.push({ ...item, airingAt });
            }
            if (!json.pagination?.has_next_page) break;
            if (page === 100) throw new Error('Schedule pagination limit exceeded');
        }
    }
    return items;
}

export async function fetchDaySchedule(day, { signal } = {}) {
    const range = getLocalDayRange(day);
    if (!range) throw new Error('Invalid schedule day');
    const entry = getScheduleCache()[day];
    const matching = entry?.start === range.startUtcSec && Array.isArray(entry.data);
    if (matching && Date.now() - entry.ts < 3600000) return entry.data;
    let data;
    try {
        data = await aniListSchedule(day, range, signal);
    } catch (error) {
        if (signal?.aborted) throw error;
        try { data = await jikanSchedule(range, signal); }
        catch (fallbackError) {
            if (signal?.aborted) throw fallbackError;
            if (matching) return entry.data;
            throw fallbackError;
        }
    }
    if (signal?.aborted) throw signal.reason;
    const unique = [...new Map(data.map(item => [item.mal_id, item])).values()];
    setScheduleCache({ ...getScheduleCache(), [day]: { data: unique, ts: Date.now(), start: range.startUtcSec } });
    return unique;
}
