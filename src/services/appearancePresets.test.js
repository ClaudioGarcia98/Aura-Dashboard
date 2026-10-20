import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { createAppearancePreset, parseAppearancePreset, applyAppearancePreset } from './appearancePresets';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import { useFocusStore, initialFocusState } from '../stores/useFocusStore';
import { getBackgroundBlob, saveBackgroundBlob, deleteBackgroundBlob } from './db';
import { GIF_BASE64, gifBlob, mockMediaDecoder } from '../testSupport/backgroundMedia';

vi.mock('./db', () => ({ getBackgroundBlob: vi.fn(), saveBackgroundBlob: vi.fn(), deleteBackgroundBlob: vi.fn() }));
const preset = () => ({
    format: 'aura-preset', version: 1, name: 'Evening setup',
    appearance: { theme: 'mocha', font: 'outfit' }, wallpaper: { kind: 'keep' },
    music: { selectedVideoId: 'Gu-g8FRG4Zs', stations: [{ name: 'Anime Lofi', videoId: 'Gu-g8FRG4Zs' }] },
});
const wallpaper = () => ({ kind: 'embedded', name: 'cozy.gif', dataUrl: `data:image/gif;base64,${GIF_BASE64}` });

it('preserves the recipient time zone and Japan reference when applying a shared preset', async () => {
    useSettingsStore.setState({ timeZone: 'Asia/Tokyo', showJapanTime: false });
    await applyAppearancePreset(JSON.stringify(preset()));
    expect(useSettingsStore.getState()).toMatchObject({ timeZone: 'Asia/Tokyo', showJapanTime: false });
});
beforeEach(() => {
    localStorage.clear(); vi.clearAllMocks();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), backgroundUrl: 'blob:current', backgroundIsVideo: true });
    useFocusStore.setState(initialFocusState());
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: vi.fn(() => 'blob:imported'), revokeObjectURL: vi.fn() }));
    getBackgroundBlob.mockResolvedValue(null);
    saveBackgroundBlob.mockResolvedValue(); deleteBackgroundBlob.mockResolvedValue();
    mockMediaDecoder();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('exports a compact setup without personal profiles, tasks, layout or volume', async () => {
    const state = { ...useSettingsStore.getState(), username: 'Personal name', malUsername: 'private-profile', fallbackCity: 'Private city', volume: 0.7 };
    const raw = await createAppearancePreset(state);
    const parsed = parseAppearancePreset(raw);
    expect(parsed.wallpaper).toEqual({ kind: 'default' });
    expect(parsed.music.stations).toHaveLength(DEFAULT_SETTINGS.lofiStations.length);
    expect(raw.length).toBeLessThan(2000);
    for (const value of ['Personal name', 'private-profile', 'Private city', 'volume', 'showWeatherWidget', 'tasks', 'blob:current']) expect(raw).not.toContain(value);
});

it('round-trips a local wallpaper in the preset without linking to a device-only blob URL', async () => {
    getBackgroundBlob.mockResolvedValue(gifBlob());
    const raw = await createAppearancePreset({ ...useSettingsStore.getState(), gifName: 'cozy.gif' });
    expect(parseAppearancePreset(raw).wallpaper).toEqual(wallpaper());
    await applyAppearancePreset(raw);
    expect(saveBackgroundBlob).toHaveBeenCalledWith(expect.any(Blob));
    expect(saveBackgroundBlob.mock.calls[0][0].type).toBe('image/gif');
    expect(useSettingsStore.getState()).toMatchObject({ gifName: 'cozy.gif', backgroundUrl: 'blob:imported', backgroundIsVideo: false });
});

it('exports without a wallpaper when the user opts out and never reads their uploaded file', async () => {
    const raw = await createAppearancePreset({ ...useSettingsStore.getState(), gifName: 'large-video.mp4' }, { includeWallpaper: false });
    expect(parseAppearancePreset(raw).wallpaper).toEqual({ kind: 'keep' });
    expect(getBackgroundBlob).not.toHaveBeenCalled();
});

it('applies appearance and stations while preserving profiles, tasks, layout, volume and current wallpaper', async () => {
    useSettingsStore.setState({ language: 'pt-BR', username: 'Alice', malUsername: 'alice-mal', volume: 0, showWeatherWidget: false, gifName: 'my-wallpaper.mp4' });
    useFocusStore.getState().addTask('Study');
    await applyAppearancePreset(JSON.stringify(preset()));
    expect(useSettingsStore.getState()).toMatchObject({ language: 'pt-BR', theme: 'mocha', font: 'outfit', username: 'Alice', malUsername: 'alice-mal', volume: 0, showWeatherWidget: false, backgroundUrl: 'blob:current', gifName: 'my-wallpaper.mp4' });
    expect(useFocusStore.getState().tasks[0].text).toBe('Study');
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(deleteBackgroundBlob).not.toHaveBeenCalled();
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().theme).toBe('mocha');
    expect(useSettingsStore.getState().language).toBe('pt-BR');
});

it('restores the default wallpaper only when the preset asks for it', async () => {
    await applyAppearancePreset(JSON.stringify({ ...preset(), wallpaper: { kind: 'default' } }));
    expect(deleteBackgroundBlob).toHaveBeenCalledTimes(1);
    expect(useSettingsStore.getState()).toMatchObject({ gifName: '', backgroundIsVideo: true });
    expect(useSettingsStore.getState().backgroundUrl).not.toBe('blob:current');
});

it.each([
    p => ({ ...p, version: 99 }),
    p => ({ ...p, username: 'Unexpected profile field' }),
    p => ({ ...p, appearance: { theme: '__proto__', font: 'default' } }),
    p => ({ ...p, music: { stations: [{ name: 'Bad', videoId: null }], selectedVideoId: null } }),
    p => ({ ...p, music: { stations: [...p.music.stations, ...p.music.stations], selectedVideoId: 'Gu-g8FRG4Zs' } }),
    p => ({ ...p, music: { ...p.music, selectedVideoId: 'lTRiuFIWV54' } }),
    p => ({ ...p, wallpaper: { kind: 'embedded', name: 'bad.svg', dataUrl: 'data:image/svg+xml;base64,aGVsbG8=' } }),
    p => ({ ...p, wallpaper: { kind: 'embedded', name: 'bad', dataUrl: 'https://example.com/wallpaper.jpg' } }),
])('rejects invalid presets before changing settings or wallpaper', async change => {
    const previous = localStorage.getItem('dash_settings');
    await expect(applyAppearancePreset(JSON.stringify(change(preset())))).rejects.toThrow();
    expect(localStorage.getItem('dash_settings')).toBe(previous);
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(deleteBackgroundBlob).not.toHaveBeenCalled();
});

it('rolls back the settings file if saving a wallpaper fails', async () => {
    const previous = localStorage.getItem('dash_settings');
    saveBackgroundBlob.mockRejectedValueOnce(new Error('Disk full'));
    await expect(applyAppearancePreset(JSON.stringify({ ...preset(), wallpaper: wallpaper() }))).rejects.toThrow('current setup has been kept');
    expect(useSettingsStore.getState().theme).toBe(DEFAULT_SETTINGS.theme);
    expect(localStorage.getItem('dash_settings')).toBe(previous);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:imported');
});

it('does not write wallpaper or update UI settings if browser storage is full', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota full'); });
    await expect(applyAppearancePreset(JSON.stringify({ ...preset(), wallpaper: wallpaper() }))).rejects.toThrow();
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().theme).toBe(DEFAULT_SETTINGS.theme);
});

it('rejects a corrupt embedded wallpaper before writing settings or media', async () => {
    vi.stubGlobal('Image', class {
        set src(value) { if (value) queueMicrotask(() => this.onerror?.()); }
    });
    const previous = localStorage.getItem('dash_settings');
    await expect(applyAppearancePreset(JSON.stringify({ ...preset(), wallpaper: {
        kind: 'embedded', name: 'corrupt.gif', dataUrl: 'data:image/gif;base64,aGVsbG8=',
    } }))).rejects.toThrow('current setup has been kept');
    expect(localStorage.getItem('dash_settings')).toBe(previous);
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:current');
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
});

it('preserves an intentionally empty station list', async () => {
    await applyAppearancePreset(JSON.stringify({ ...preset(), music: { stations: [], selectedVideoId: null } }));
    expect(useSettingsStore.getState().lofiStations).toEqual([]);
});

it.each(['keep', 'embedded'])('clears a pending quota fallback before applying a %s preset', async kind => {
    const failedWrite = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    useSettingsStore.getState().setUsername('Pending preference');
    failedWrite.mockRestore();
    const value = { ...preset(), wallpaper: kind === 'embedded' ? wallpaper() : { kind: 'keep' } };
    await applyAppearancePreset(JSON.stringify(value));
    // Rehydration used to read the older pending-memory entry and replace the
    // imported appearance even though its durable write had succeeded.
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ username: 'Pending preference', theme: 'mocha', font: 'outfit' });
    useSettingsStore.getState().setMalStatus('loading');
    expect(JSON.parse(localStorage.getItem('dash_settings')).state.theme).toBe('mocha');
});

it('retains pending preferences if a preset media transaction fails after storage recovers', async () => {
    const failedWrite = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    useSettingsStore.getState().setUsername('Pending preference');
    failedWrite.mockRestore();
    saveBackgroundBlob.mockRejectedValueOnce(new Error('Database full'));
    await expect(applyAppearancePreset(JSON.stringify({ ...preset(), wallpaper: wallpaper() }))).rejects.toThrow();
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState()).toMatchObject({ username: 'Pending preference', theme: DEFAULT_SETTINGS.theme });
});
