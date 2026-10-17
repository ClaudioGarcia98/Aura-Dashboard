export function parseMALItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.filter(a => a && Number.isFinite(Number(a.anime_id)) && a.anime_title).map(a => ({
        mal_id: a.anime_id,
        url: 'https://myanimelist.net' + a.anime_url,
        image_url: a.anime_image_path,
        title: a.anime_title,
        score: a.anime_score_val || 'N/A',
        watched_eps: a.num_watched_episodes,
    }));
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
        const malId = m.idMal || `anilist:${m.id}`;
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
            titles: m.title || {},
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
