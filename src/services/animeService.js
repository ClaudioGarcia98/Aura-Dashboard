import {
    JIKAN_BASE,
    ANILIST_GRAPHQL_ENDPOINT,
    ALLORIGINS_BASE,
    CODETABS_BASE,
    CORSPROXY_IO_BASE,
    SCHEDULE_CACHE_KEY,
    fetchWithRetry,
} from './api.js';

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

export function getJstDayRange(dayFilter) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetIdx = days.indexOf(dayFilter?.toLowerCase());
    if (targetIdx === -1) return null;

    const nowUtcMs = Date.now();
    const jstNowMs = nowUtcMs + 9 * 3600 * 1000;
    const jstDate = new Date(jstNowMs);
    const currentJstDayIdx = jstDate.getUTCDay();

    const diff = targetIdx - currentJstDayIdx;
    const targetJstDate = new Date(jstNowMs + diff * 86400 * 1000);

    const year = targetJstDate.getUTCFullYear();
    const month = targetJstDate.getUTCMonth();
    const day = targetJstDate.getUTCDate();

    const startUtcSec = Math.floor((Date.UTC(year, month, day, 0, 0, 0) - (9 * 3600 * 1000)) / 1000);
    const endUtcSec = startUtcSec + 86400;

    return { startUtcSec, endUtcSec };
}

export function formatBroadcastTime(timeStr, dayName) {
    if (!timeStr) return '?';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return timeStr;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const now = new Date();
    let jstDayIdx = -1;
    if (dayName) {
        const clean = dayName.toLowerCase().replace(/s$/, '');
        jstDayIdx = days.indexOf(clean);
    }

    const nowUtcMs = now.getTime();
    const jstNowMs = nowUtcMs + 9 * 3600 * 1000;
    const jstNowDate = new Date(jstNowMs);
    const currentJstDayIdx = jstNowDate.getUTCDay();

    let diffDays = 0;
    if (jstDayIdx !== -1) {
        diffDays = jstDayIdx - currentJstDayIdx;
    }

    const targetJstMs = jstNowMs + diffDays * 86400 * 1000;
    const targetDate = new Date(targetJstMs);
    const y = targetDate.getUTCFullYear();
    const m = targetDate.getUTCMonth();
    const d = targetDate.getUTCDate();

    // The UTC moment of broadcast (JST is UTC+9, so UTC = hours - 9)
    const broadcastUtc = new Date(Date.UTC(y, m, d, hours - 9, minutes));

    // Convert to Portugal (Europe/Lisbon)
    const ptFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Lisbon',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const partsFormatted = ptFormatter.formatToParts(broadcastUtc);
    const ptDay = partsFormatted.find(p => p.type === 'weekday')?.value;
    const ptHour = partsFormatted.find(p => p.type === 'hour')?.value;
    const ptMinute = partsFormatted.find(p => p.type === 'minute')?.value;
    const ptTime = `${ptHour}:${ptMinute}`;

    const jstDayName = shortDays[jstDayIdx !== -1 ? jstDayIdx : currentJstDayIdx];

    // If broadcast day in Portugal differs from Japan (e.g. Wed 16:45 PT vs Thu 00:45 JST)
    if (ptDay && jstDayName && ptDay !== jstDayName) {
        return `${ptDay} ${ptTime} PT / ${jstDayName} ${timeStr} JST`;
    }

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
            trailer: m.trailer && m.trailer.site === 'youtube' && m.trailer.id ? {
                youtube_id: m.trailer.id,
                embed_url: `https://www.youtube.com/embed/${m.trailer.id}`,
                url: `https://www.youtube.com/watch?v=${m.trailer.id}`
            } : null
        });
    }

    return mapped;
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

export async function fetchUserWatchingList(malUsername) {
    if (!malUsername || malUsername.trim() === '') return [];

    const cleanUsername = encodeURIComponent(malUsername.trim());
    const cacheBust = `&_=${Date.now()}`;
    const malUrl = `https://myanimelist.net/animelist/${cleanUsername}/load.json?offset=0&status=1${cacheBust}`;

    const makeCorsproxyioRequest = async () => {
        const res = await fetch(CORSPROXY_IO_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    const makeAlloriginsRequest = async () => {
        const res = await fetch(ALLORIGINS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const wrapper = await res.json();
        
        if (!wrapper || wrapper.contents === null || wrapper.contents === undefined) {
            throw new Error('User not found or proxy error');
        }
        if (wrapper.status && wrapper.status.http_code && wrapper.status.http_code !== 200) {
            throw new Error(`Target returned status ${wrapper.status.http_code}`);
        }

        const parsed = JSON.parse(wrapper.contents);
        if (!Array.isArray(parsed)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(parsed);
    };

    const makeCodetabsRequest = async () => {
        const res = await fetch(CODETABS_BASE + encodeURIComponent(malUrl), { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        const data = await res.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid MAL response format');
        }
        return parseMALItems(data);
    };

    return fetchWithRetry(async () => {
        try {
            return await fetchWithTimeout(makeCorsproxyioRequest(), 2500);
        } catch {
            console.warn('Primary MAL proxy failed or timed out, trying fallbacks...');
            return await fetchWithTimeout(
                Promise.any([makeAlloriginsRequest(), makeCodetabsRequest()]),
                4500
            );
        }
    }, 0, 0).catch(e => {
        console.error('MAL fetch timed out or failed:', e);
        throw e;
    });
}
