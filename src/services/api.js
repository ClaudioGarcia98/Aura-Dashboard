export const JIKAN_BASE = 'https://api.jikan.moe/v4';
export const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';
export const ALLORIGINS_BASE = 'https://api.allorigins.win/get?url=';
export const ALLORIGINS_RAW_BASE = 'https://api.allorigins.win/raw?url=';
export const CODETABS_BASE = 'https://api.codetabs.com/v1/proxy?quest=';
export const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
export const FEED2JSON_BASE = 'https://feed2json.org/convert?url=';
export const SCHEDULE_CACHE_KEY = 'dash_anime_schedule_v3';
export const WATCHING_CACHE_KEY = 'dash_anime_watching';

export async function fetchWithRetry(fn, retries = 1, delay = 500) {
    try {
        return await fn();
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, delay));
            return fetchWithRetry(fn, retries - 1, delay);
        }
        throw e;
    }
}
