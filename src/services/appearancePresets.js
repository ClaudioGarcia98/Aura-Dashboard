import { THEMES, FONTS, themeLabel } from '../constants/settingsConstants';
import { DEFAULT_SETTINGS, sanitizeSettings } from '../stores/settingsSchema';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getBackgroundBlob, saveBackgroundBlob, deleteBackgroundBlob } from './db';
import { videoId } from '../utils/urls';
import { DEFAULT_BACKGROUND } from '../constants/background';

export const MAX_WALLPAPER_BYTES = 50 * 1024 * 1024;
export const MAX_PRESET_BYTES = Math.ceil(MAX_WALLPAPER_BYTES * 4 / 3) + 256 * 1024;
const MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
const record = value => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
function keysOnly(value, keys) {
    if (!record(value) || Object.keys(value).some(key => !keys.includes(key))) throw new Error('This is not a supported Aura appearance preset.');
}

export function parseAppearancePreset(raw) {
    if (typeof raw !== 'string' || raw.length > MAX_PRESET_BYTES) throw new Error('Preset is too large (50 MB wallpaper limit).');
    let input;
    try { input = JSON.parse(raw); } catch { throw new Error('Choose a valid Aura preset JSON file.'); }
    keysOnly(input, ['format', 'version', 'name', 'appearance', 'wallpaper', 'music']);
    if (input.format !== 'aura-preset' || input.version !== 1 || !text(input.name, 80)) throw new Error('This is not a supported Aura appearance preset.');
    keysOnly(input.appearance, ['theme', 'font']);
    if (typeof input.appearance.theme !== 'string' || typeof input.appearance.font !== 'string' || !Object.hasOwn(THEMES, input.appearance.theme) || !Object.hasOwn(FONTS, input.appearance.font)) throw new Error('Preset contains an unknown theme or font.');
    keysOnly(input.music, ['selectedVideoId', 'stations']);
    const { stations, selectedVideoId } = input.music;
    if (!Array.isArray(stations) || stations.length > 200) throw new Error('Preset contains an invalid station list.');
    const seen = new Set();
    for (const station of stations) {
        keysOnly(station, ['name', 'videoId']);
        if (typeof station.name !== 'string' || station.name.length > 500 || typeof station.videoId !== 'string' || videoId(station.videoId) !== station.videoId || seen.has(station.videoId)) throw new Error('Preset contains an invalid or duplicate station.');
        seen.add(station.videoId);
    }
    if (stations.length ? !seen.has(selectedVideoId) : selectedVideoId !== null) throw new Error('The selected station is missing from this preset.');
    keysOnly(input.wallpaper, ['kind', 'name', 'dataUrl']);
    const wallpaper = input.wallpaper;
    if (!['default', 'keep', 'embedded'].includes(wallpaper.kind)) throw new Error('Preset contains an unsupported wallpaper.');
    if (wallpaper.kind === 'embedded') {
        if (!text(wallpaper.name, 500) || typeof wallpaper.dataUrl !== 'string') throw new Error('Preset wallpaper is invalid.');
        const match = wallpaper.dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/);
        if (!match || !MEDIA_TYPES.has(match[1]) || match[2].length % 4 !== 0) throw new Error('Preset wallpaper must be an image or video file.');
        const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
        if (bytes <= 0 || bytes > MAX_WALLPAPER_BYTES) throw new Error('Wallpaper exceeds the 50 MB limit.');
    } else if (wallpaper.name !== undefined || wallpaper.dataUrl !== undefined) throw new Error('Preset wallpaper is invalid.');
    return input;
}

function blobDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read your uploaded wallpaper.'));
        reader.readAsDataURL(blob);
    });
}

export async function createAppearancePreset(state, { includeWallpaper = true } = {}) {
    const clean = { ...DEFAULT_SETTINGS, ...sanitizeSettings(state) };
    let wallpaper = { kind: includeWallpaper ? 'default' : 'keep' };
    if (includeWallpaper && state.gifName) {
        const blob = await getBackgroundBlob();
        if (!blob || !MEDIA_TYPES.has(blob.type)) throw new Error('Could not read your wallpaper. Export with “Include wallpaper” switched off.');
        if (blob.size > MAX_WALLPAPER_BYTES) throw new Error('Wallpaper exceeds the 50 MB limit.');
        wallpaper = { kind: 'embedded', name: state.gifName, dataUrl: await blobDataUrl(blob) };
    }
    const stations = clean.lofiStations.map(({ name, videoId }) => ({ name, videoId }));
    const preset = {
        format: 'aura-preset', version: 1, name: `${themeLabel(clean.theme)} setup`,
        appearance: { theme: clean.theme, font: clean.font }, wallpaper,
        music: { stations, selectedVideoId: stations.find(station => station.videoId === clean.lofiId)?.videoId ?? stations[0]?.videoId ?? null },
    };
    const raw = JSON.stringify(preset);
    parseAppearancePreset(raw);
    return raw;
}

// Only appearance and music are applied; personal profiles, tasks and layout
// settings stay outside the preset format.
export async function applyAppearancePreset(raw) {
    const preset = parseAppearancePreset(raw);
    const { wallpaper } = preset;
    let blob = null;
    let objectUrl = null;
    if (wallpaper.kind === 'embedded') {
        const [header, base64] = wallpaper.dataUrl.split(',');
        const decoded = atob(base64);
        blob = new Blob([Uint8Array.from(decoded, char => char.charCodeAt(0))], { type: header.slice(5, -7) });
        objectUrl = URL.createObjectURL(blob);
    }
    const updates = {
        ...preset.appearance,
        lofiStations: preset.music.stations.map((station, index) => ({ id: index + 1, ...station })),
        lofiId: preset.music.selectedVideoId || DEFAULT_SETTINGS.lofiId,
        ...(wallpaper.kind === 'keep' ? {} : { gifName: wallpaper.kind === 'embedded' ? wallpaper.name : '' }),
    };
    const storage = globalThis.localStorage;
    let previous;
    let wroteSettings = false;
    try {
        previous = storage.getItem('dash_settings');
        const settings = sanitizeSettings({ ...useSettingsStore.getState(), ...updates });
        // Fail before changing media if the browser cannot persist the preset.
        storage.setItem('dash_settings', JSON.stringify({ state: settings, version: 1 }));
        wroteSettings = true;
        if (wallpaper.kind === 'embedded') await saveBackgroundBlob(blob);
        else if (wallpaper.kind === 'default') await deleteBackgroundBlob();
    } catch (error) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        if (wroteSettings) {
            if (previous === null) storage.removeItem('dash_settings');
            else storage.setItem('dash_settings', previous);
        }
        throw new Error('Could not save this preset. Your current setup has been kept.', { cause: error });
    }
    useSettingsStore.setState({
        ...updates,
        ...(wallpaper.kind === 'keep' ? {} : {
            backgroundUrl: objectUrl || DEFAULT_BACKGROUND.url,
            backgroundIsVideo: wallpaper.kind === 'default' || blob.type.startsWith('video/'),
        }),
    });
    return preset;
}
