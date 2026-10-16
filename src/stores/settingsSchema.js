import { THEMES, FONTS } from '../constants/settingsConstants';
import { httpUrl, videoId } from '../utils/urls';

export const DEFAULT_STATIONS = [
    { videoId: 'lTRiuFIWV54', name: 'Lofi Girl' },
    { videoId: '4xDzrJKXOOY', name: 'Synthwave Radio' },
    { videoId: '5yx6BWlEVcY', name: 'Chillhop Music' },
    { videoId: 'Dx5qFachd3A', name: 'Jazzhop Cafe' },
    { videoId: 'F1B9Fk_SgI0', name: 'Ambient Rain' },
    { videoId: 'Gu-g8FRG4Zs', name: 'Anime Lofi' },
].map((station, i) => ({ id: i + 1, ...station }));

export const DEFAULT_SETTINGS = {
    theme: 'aurora', font: 'default', clockMode: 'digital', username: 'Cláudio',
    malUsername: '', fallbackCity: '', use24hClock: true, useCelsius: true,
    gifName: '', lofiId: 'Gu-g8FRG4Zs', lofiStations: DEFAULT_STATIONS,
    volume: 0.2, speedDials: [], customEngines: [], remoteSuggestions: false,
    pauseBackground: false,
    showWeatherWidget: true, showQuote: true, showSearchBox: true, showSpeedDial: true,
    showTop5Anime: true, showAnimeSidebar: true, showLofiPlayer: true,
};

const record = value => value && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.length <= 500;
const id = value => (typeof value === 'string' && value.length > 0 && value.length <= 100) || (typeof value === 'number' && Number.isFinite(value));
const checks = {
    theme: value => typeof value === 'string' && Object.hasOwn(THEMES, value),
    font: value => typeof value === 'string' && Object.hasOwn(FONTS, value),
    clockMode: value => ['digital', 'analog', 'both'].includes(value),
    volume: value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1,
    lofiId: value => !!videoId(value),
    speedDials: item => record(item) && id(item.id) && text(item.name) && !!httpUrl(item.url),
    lofiStations: item => record(item) && id(item.id) && text(item.name) && !!videoId(item.videoId),
    customEngines: item => record(item) && text(item.name) && typeof item.prefix === 'string' && /^[a-z\d]{1,12} $/i.test(item.prefix) && typeof item.url === 'string' && item.url.includes('%s') && !!httpUrl(item.url.replace('%s', 'query')),
};

// Whitelist data fields on every hydration, not only version migrations.
export function sanitizeSettings(input, { strict = false } = {}) {
    if (!record(input)) {
        if (strict) throw new Error('Settings must be an object.');
        return {};
    }
    const result = {};
    for (const [key, value] of Object.entries(input)) {
        if (!Object.hasOwn(DEFAULT_SETTINGS, key)) {
            if (strict) throw new Error(`Unknown setting: ${key}`);
            continue;
        }
        const fallback = DEFAULT_SETTINGS[key];
        if (Array.isArray(fallback)) {
            if (!Array.isArray(value) || value.length > 200) {
                if (strict) throw new Error(`Invalid setting: ${key}`);
                continue;
            }
            const seen = new Set();
            const seenIds = new Set();
            result[key] = value.filter(item => {
                const unique = key === 'lofiStations' ? item?.videoId : key === 'customEngines' ? item?.prefix : String(item?.id);
                const valid = checks[key](item) && !seen.has(unique) && (key === 'customEngines' || !seenIds.has(String(item.id)));
                if (!valid && strict) throw new Error(`Invalid or duplicate item in ${key}`);
                if (valid) { seen.add(unique); seenIds.add(String(item.id)); }
                return valid;
            }).map(item => key === 'speedDials' ? { id: item.id, name: item.name, url: httpUrl(item.url) }
                : key === 'lofiStations' ? { id: item.id, name: item.name, videoId: videoId(item.videoId) }
                    : { name: item.name, prefix: item.prefix, url: item.url });
        } else {
            const valid = checks[key] ? checks[key](value) : typeof fallback === 'boolean' ? typeof value === 'boolean' : text(value);
            if (valid) result[key] = value;
            else if (strict) throw new Error(`Invalid setting: ${key}`);
        }
    }
    return result;
}

export const LEGACY_KEYS = {
    theme: 'dash_theme', font: 'dash_font', clockMode: 'dash_clock', username: 'dash_username',
    malUsername: 'dash_mal_username', fallbackCity: 'dash_fallback_city', use24hClock: 'dash_24h',
    useCelsius: 'dash_celsius', gifName: 'dash_gif_name', lofiId: 'dash_lofi_id', volume: 'dash_volume',
    speedDials: 'dash_speed_dials', customEngines: 'dash_custom_engines',
    showWeatherWidget: 'dash_show_weather', showQuote: 'dash_show_quote', showSearchBox: 'dash_show_search',
    showSpeedDial: 'dash_show_speeddial', showTop5Anime: 'dash_show_top5',
    showAnimeSidebar: 'dash_show_anime_sidebar', showLofiPlayer: 'dash_show_lofi',
};

export function readLegacySettings(storage) {
    const values = {};
    for (const [key, legacyKey] of Object.entries(LEGACY_KEYS)) {
        const raw = storage.getItem(legacyKey);
        if (raw === null) continue;
        try {
            values[key] = typeof DEFAULT_SETTINGS[key] === 'string' ? raw : JSON.parse(raw);
        } catch { /* Invalid legacy entries use defaults. */ }
    }
    return sanitizeSettings(values);
}
