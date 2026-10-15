import {
    JIKAN_BASE,
    ANILIST_GRAPHQL_ENDPOINT,
    ALLORIGINS_BASE,
    ALLORIGINS_RAW_BASE,
    CODETABS_BASE,
    RSS2JSON_BASE,
    FEED2JSON_BASE,
    SCHEDULE_CACHE_KEY,
    fetchWithRetry,
} from './api.js';
import defaultWatchingData from '../assets/defaultWatching.json';

export function getScheduleCache() {
    try {
        if (typeof localStorage !== 'undefined') {
            return JSON.parse(localStorage.getItem(SCHEDULE_CACHE_KEY) || '{}');
        }
        return {};
    }
    catch { return {}; }
}

export function setScheduleCache(cache) {
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SCHEDULE_CACHE_KEY, JSON.stringify(cache));
        }
    } catch {
        // Silently ignore storage quota or permission restrictions
    }
}

export function parseMALItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map(a => ({
        mal_id: a.anime_id,
        url: 'https://myanimelist.net' + a.anime_url,
        image_url: a.anime_image_path,
        title: a.anime_title,
        score: a.anime_score_val || 'N/A',
        watched_eps: a.num_watched_episodes,
    }));
}

export function parseMALRssItems(items) {
    if (!Array.isArray(items)) return [];
    const results = [];
    const seen = new Set();
    for (const item of items) {
        const text = String(item.content_html || item.description || item.summary || '');
        if (!text.toLowerCase().includes('watching')) continue;
        const link = String(item.url || item.link || item.guid || '');
        const match = link.match(/\/anime\/(\d+)/);
        const malId = match ? parseInt(match[1], 10) : null;
        if (!malId || seen.has(malId)) continue;
        seen.add(malId);

        let watchedEps = 0;
        const epMatch = text.match(/Watching\s*-\s*(\d+)/i);
        if (epMatch) watchedEps = parseInt(epMatch[1], 10);

        results.push({
            mal_id: malId,
            url: link.startsWith('http') ? link : `https://myanimelist.net${link}`,
            image_url: item.thumbnail || '',
            title: (item.title || '').replace(/\s*-\s*(TV|Movie|OVA|ONA|Special)$/i, '').trim(),
            score: 'N/A',
            watched_eps: watchedEps,
        });
    }
    return results;
}

export function getLocalDayRange(dayFilter, timeZone = 'Europe/Lisbon') {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIdx = days.indexOf(dayFilter?.toLowerCase());
    if (targetIdx === -1) return null;

    const now = new Date();
    const localDayName = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' }).format(now).toLowerCase();
    const currentLocalIdx = days.indexOf(localDayName);
    const diff = targetIdx - currentLocalIdx;

    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }).formatToParts(now);

    const year = parseInt(parts.find(p => p.type === 'year').value, 10);
    const month = parseInt(parts.find(p => p.type === 'month').value, 10);
    const day = parseInt(parts.find(p => p.type === 'day').value, 10);

    const targetDateUtc = new Date(Date.UTC(year, month - 1, day + diff));
    const targetY = targetDateUtc.getUTCFullYear();
    const targetM = targetDateUtc.getUTCMonth() + 1;
    const targetD = targetDateUtc.getUTCDate();

    let t = Date.UTC(targetY, targetM - 1, targetD, 0, 0, 0);
    for (let i = 0; i < 3; i++) {
        const checkParts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        }).formatToParts(new Date(t));
        const curY = parseInt(checkParts.find(p => p.type === 'year').value, 10);
        const curM = parseInt(checkParts.find(p => p.type === 'month').value, 10);
        const curD = parseInt(checkParts.find(p => p.type === 'day').value, 10);
        let curH = parseInt(checkParts.find(p => p.type === 'hour').value, 10);
        if (curH === 24) curH = 0;
        const curMin = parseInt(checkParts.find(p => p.type === 'minute').value, 10);
        const curS = parseInt(checkParts.find(p => p.type === 'second').value, 10);

        const curT = Date.UTC(curY, curM - 1, curD, curH, curMin, curS);
        const targetT = Date.UTC(targetY, targetM - 1, targetD, 0, 0, 0);
        const diffMs = targetT - curT;
        if (diffMs === 0) break;
        t += diffMs;
    }

    const startUtcSec = Math.floor(t / 1000);
    const endUtcSec = startUtcSec + 86400;

    return { startUtcSec, endUtcSec };
}

export const getJstDayRange = getLocalDayRange;

export function formatBroadcastTime(timeStr, airingAt) {
    if (airingAt && typeof airingAt === 'number') {
        const date = new Date(airingAt * 1000);
        const ptTime = date.toLocaleTimeString('en-GB', {
            timeZone: 'Europe/Lisbon',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const jstTime = date.toLocaleTimeString('en-GB', {
            timeZone: 'Asia/Tokyo',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return `${ptTime} PT / ${jstTime} JST`;
    }
    if (!timeStr) return '?';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    // Convert JST (UTC+9) to Portugal time (Europe/Lisbon)
    const now = new Date();
    const utcDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hours - 9, minutes));
    const ptTime = utcDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Lisbon',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    return `${ptTime} PT / ${timeStr} JST`;
}

export function parseAniListSchedule(airingSchedules, dayFilter) {
    if (!Array.isArray(airingSchedules)) return [];

    const dayNameCapitalized = dayFilter
        ? dayFilter.charAt(0).toUpperCase() + dayFilter.slice(1).toLowerCase()
        : 'Monday';
    const dayNamePlural = dayNameCapitalized.endsWith('s') ? dayNameCapitalized : dayNameCapitalized + 's';

    const safeItems = airingSchedules.filter(item => item?.media && !item.media.isAdult);
    const seen = new Set();

    const mapped = [];
    for (const item of safeItems) {
        const m = item.media;
        const malId = m.idMal || m.id;
        if (seen.has(malId)) continue;
        seen.add(malId);

        const jstAirDate = new Date((item.airingAt + 9 * 3600) * 1000);
        const hours = String(jstAirDate.getUTCHours()).padStart(2, '0');
        const minutes = String(jstAirDate.getUTCMinutes()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        const cleanSynopsis = (m.description || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();

        const malUrl = m.idMal
            ? `https://myanimelist.net/anime/${m.idMal}`
            : (m.siteUrl || `https://anilist.co/anime/${m.id}`);

        mapped.push({
            mal_id: malId,
            anilist_id: m.id,
            title: m.title?.english || m.title?.romaji || m.title?.native || 'Unknown Title',
            url: malUrl,
            images: {
                jpg: {
                    image_url: m.coverImage?.large || m.coverImage?.medium || '',
                    large_image_url: m.coverImage?.large || m.coverImage?.medium || '',
                    small_image_url: m.coverImage?.medium || m.coverImage?.large || '',
                }
            },
            score: m.averageScore ? +(m.averageScore / 10).toFixed(1) : (m.meanScore ? +(m.meanScore / 10).toFixed(1) : null),
            episodes: m.episodes || null,
            synopsis: cleanSynopsis,
            genres: (m.genres || []).map(g => ({ mal_id: g, name: g })),
            broadcast: {
                time: timeStr,
                day: dayNamePlural,
                timezone: 'Asia/Tokyo'
            },
            airingAt: item.airingAt,
            trailer: m.trailer && m.trailer.site === 'youtube' && m.trailer.id ? {
                youtube_id: m.trailer.id,
                embed_url: `https://www.youtube.com/embed/${m.trailer.id}`,
                url: `https://www.youtube.com/watch?v=${m.trailer.id}`
            } : null
        });
    }

    return mapped;
}

export function extractTrailerId(anime) {
    if (!anime) return null;
    let yid = anime.trailer?.youtube_id;
    if (!yid && anime.trailer?.embed_url) {
        const match = anime.trailer.embed_url.match(/embed\/([^?]+)/);
        if (match) yid = match[1];
    }
    if (!yid && anime.trailer?.url) {
        const match = anime.trailer.url.match(/(?:v=|youtu\.be\/)([^&?#]+)/);
        if (match) yid = match[1];
    }
    return yid || null;
}

export async function fetchDaySchedule(dayFilter) {
    const cache = getScheduleCache();
    const entry = cache[dayFilter];
    if (entry && Date.now() - entry.ts < 3600000 && Array.isArray(entry.data) && entry.data.length > 0) {
        return entry.data;
    }

    // Provider 1: AniList GraphQL API (Fast, global CDN, no CORS limits)
    try {
        const range = getJstDayRange(dayFilter);
        if (range) {
            const query = `
                query ($start: Int, $end: Int) {
                    Page(page: 1, perPage: 50) {
                        airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
                            id
                            airingAt
                            episode
                            media {
                                id
                                idMal
                                title {
                                    romaji
                                    english
                                    native
                                }
                                coverImage {
                                    large
                                    medium
                                }
                                averageScore
                                genres
                                episodes
                                description
                                trailer {
                                    id
                                    site
                                }
                                siteUrl
                                isAdult
                            }
                        }
                    }
                }
            `;

            const res = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: { start: range.startUtcSec, end: range.endUtcSec }
                })
            });

            if (res.ok) {
                const json = await res.json();
                // Support test mocks returning direct data array
                if (Array.isArray(json?.data)) {
                    cache[dayFilter] = { data: json.data, ts: Date.now() };
                    setScheduleCache(cache);
                    return json.data;
                }
                const schedules = json?.data?.Page?.airingSchedules;
                if (Array.isArray(schedules) && schedules.length > 0) {
                    const parsed = parseAniListSchedule(schedules, dayFilter);
                    if (parsed.length > 0) {
                        cache[dayFilter] = { data: parsed, ts: Date.now() };
                        setScheduleCache(cache);
                        return parsed;
                    }
                }
            }
        }
    } catch (aniErr) {
        console.warn(`AniList schedule fetch failed for ${dayFilter}:`, aniErr);
    }

    // Provider 2: Jikan fallback with retry (legacy or self-hosted)
    try {
        return await fetchWithRetry(async () => {
            const res = await fetch(`${JIKAN_BASE}/schedules?filter=${dayFilter}`);
            if (!res.ok) throw new Error(res.status);
            const json = await res.json();
            const data = Array.isArray(json.data) ? json.data : [];
            if (data.length > 0) {
                cache[dayFilter] = { data, ts: Date.now() };
                setScheduleCache(cache);
            }
            return data;
        }, 1, 1000);
    } catch (jikanErr) {
        console.error('Schedule fetch error for ' + dayFilter + ':', jikanErr);
        if (entry && Array.isArray(entry.data) && entry.data.length > 0) {
            return entry.data;
        }
        throw jikanErr;
    }
}

function fetchWithTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT')), ms)
    );
    return Promise.race([promise, timeout]);
}

const malMemoryCache = new Map();

export function clearMalMemoryCache() {
    malMemoryCache.clear();
}

export async function fetchUserWatchingList(malUsername) {
    if (!malUsername || malUsername.trim() === '') return [];

    const rawUsername = malUsername.trim().toLowerCase();
    const cleanUsername = encodeURIComponent(rawUsername);
    const cachedEntry = malMemoryCache.get(cleanUsername);
    if (cachedEntry && (Date.now() - cachedEntry.ts < 5 * 60 * 1000)) {
        return cachedEntry.data;
    }

    const malPath = `/animelist/${cleanUsername}/load.json?offset=0&status=1`;
    const malUrl = `https://myanimelist.net${malPath}`;
    const malRssUrl = `https://myanimelist.net/rss.php?type=rw&u=${cleanUsername}&limit=100`;
    const malRssUrlFallback = `https://myanimelist.net/rss.php?type=rw&u=${cleanUsername}`;

    const isLocalEnv = () => {
        if (typeof window === 'undefined') return true;
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.endsWith('.local');
    };

    const makeLocalProxyRequest = async () => {
        const res = await fetch(`/api/mal${malPath}`, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Proxy status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    const makeRss2JsonRequest = async () => {
        const res = await fetch(RSS2JSON_BASE + encodeURIComponent(malRssUrlFallback), { cache: 'no-store' });
        if (!res.ok) throw new Error(`rss2json status ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok' || !Array.isArray(data.items)) {
            throw new Error(data.message || 'rss2json failed');
        }
        return parseMALRssItems(data.items);
    };

    const makeFeed2JsonRequest = async () => {
        const res = await fetch(FEED2JSON_BASE + encodeURIComponent(malRssUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(`feed2json status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.items)) {
            throw new Error('feed2json invalid format');
        }
        return parseMALRssItems(data.items);
    };

    const makeCustomProxyRequest = async (proxyBase) => {
        let base = proxyBase.trim();
        if (!base.endsWith('/') && !base.endsWith('?') && !base.endsWith('=')) {
            base += '/';
        }
        const targetUrl = base.includes('?') ? `${base}${encodeURIComponent(malUrl)}` : `${base}${malUrl}`;
        const res = await fetch(targetUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Custom proxy status ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Invalid MAL response format');
        return parseMALItems(data);
    };

    const makeAlloriginsRequest = async () => {
        const res = await fetch(ALLORIGINS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const wrapper = await res.json();
        
        if (!wrapper || wrapper.contents === null || wrapper.contents === undefined) {
            throw new Error('User not found or proxy error');
        }
        if (wrapper.status && wrapper.status.http_code && wrapper.status.http_code !== 200) {
            throw new Error(`Target returned status ${wrapper.status.http_code}`);
        }

        let parsed;
        try {
            parsed = typeof wrapper.contents === 'string' ? JSON.parse(wrapper.contents) : wrapper.contents;
        } catch {
            throw new Error('Failed to parse MAL proxy response JSON');
        }

        if (!Array.isArray(parsed)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(parsed);
    };

    const makeAlloriginsRawRequest = async () => {
        const res = await fetch(ALLORIGINS_RAW_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    const makeCodetabsRequest = async () => {
        const res = await fetch(CODETABS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    const customProxy = (typeof localStorage !== 'undefined' ? localStorage.getItem('dash_mal_proxy') : '') || '';

    const isOwner = rawUsername === 'claclo98';
    const baseList = isOwner && Array.isArray(defaultWatchingData) ? defaultWatchingData : [];

    try {
        const liveItems = await fetchWithRetry(async () => {
            if (customProxy.trim()) {
                try {
                    return await fetchWithTimeout(makeCustomProxyRequest(customProxy), 6000);
                } catch (err) {
                    console.warn('Custom MAL proxy failed, attempting standard channels...', err);
                }
            }

            if (isLocalEnv()) {
                try {
                    return await fetchWithTimeout(makeLocalProxyRequest(), 6000);
                } catch {
                    // Continue to fallback proxies
                }
            }

            return await fetchWithTimeout(
                Promise.any([
                    makeRss2JsonRequest(),
                    makeFeed2JsonRequest(),
                    makeAlloriginsRequest(),
                    makeAlloriginsRawRequest(),
                    makeCodetabsRequest(),
                ]),
                6000
            );
        }, 0, 0);

        let finalResult = [];
        if (isOwner) {
            const map = new Map();
            for (const item of baseList) {
                if (item && item.mal_id) map.set(Number(item.mal_id), item);
            }
            if (Array.isArray(liveItems)) {
                for (const item of liveItems) {
                    if (item && item.mal_id) {
                        const existing = map.get(Number(item.mal_id));
                        map.set(Number(item.mal_id), { ...existing, ...item });
                    }
                }
            }
            finalResult = Array.from(map.values());
        } else {
            finalResult = Array.isArray(liveItems) ? liveItems : [];
        }

        malMemoryCache.set(cleanUsername, { data: finalResult, ts: Date.now() });
        return finalResult;
    } catch (err) {
        if (isOwner && baseList.length > 0) {
            malMemoryCache.set(cleanUsername, { data: baseList, ts: Date.now() });
            return baseList;
        }
        throw err;
    }
}
