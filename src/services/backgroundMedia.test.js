import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { changeBackground, recoverBackground, validateBackgroundMedia, MAX_WALLPAPER_BYTES } from './backgroundMedia';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import { DEFAULT_BACKGROUND } from '../constants/background';
import { saveBackgroundBlob, deleteBackgroundBlob } from './db';
import { gifBlob, mockMediaDecoder } from '../testSupport/backgroundMedia';

vi.mock('./db', () => ({ saveBackgroundBlob: vi.fn(), deleteBackgroundBlob: vi.fn() }));
let decoder;
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), gifName: 'working.gif', backgroundUrl: 'blob:working', backgroundIsVideo: false });
    let nextUrl = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:media-${++nextUrl}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    saveBackgroundBlob.mockResolvedValue(); deleteBackgroundBlob.mockResolvedValue();
    decoder = mockMediaDecoder({ automatic: false });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

it('waits for a decoded real GIF before saving and replacing the previous background', async () => {
    const blob = gifBlob();
    const pending = changeBackground({ blob, name: 'new.gif' });
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
    decoder.images[0].onload();
    await pending;
    expect(saveBackgroundBlob).toHaveBeenCalledWith(blob);
    expect(useSettingsStore.getState()).toMatchObject({ gifName: 'new.gif', backgroundUrl: 'blob:media-2', backgroundIsVideo: false });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:media-1');
});

it.each([
    [new Blob([], { type: 'image/gif' }), 'empty'],
    [new Blob(['svg'], { type: 'image/svg+xml' }), 'Choose a PNG'],
    [{ type: 'image/gif', size: MAX_WALLPAPER_BYTES + 1 }, '50MB'],
])('rejects invalid type/size before creating URLs or changing persistence', async (blob, message) => {
    await expect(changeBackground({ blob })).rejects.toThrow(message);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
});

it('rejects corrupt images and releases the validation URL while retaining the working file', async () => {
    const pending = changeBackground({ blob: new Blob(['broken'], { type: 'image/png' }), name: 'broken.png' });
    const rejected = expect(pending).rejects.toThrow('could not be played');
    decoder.images[0].onerror();
    await rejected;
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:media-1');
    expect(useSettingsStore.getState().gifName).toBe('working.gif');
});

it('requires a playable video frame and rejects browser codec errors', async () => {
    const pending = changeBackground({ blob: new Blob(['unsupported codec'], { type: 'video/mp4' }) });
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    const rejected = expect(pending).rejects.toThrow('could not be played');
    decoder.videos[0].onerror();
    await rejected;
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(decoder.videos[0].hasAttribute('src')).toBe(false);
});

it('bounds a stalled decoder and cleans up when cancelled', async () => {
    vi.useFakeTimers();
    const pending = validateBackgroundMedia(gifBlob(), { timeoutMs: 100 });
    const rejected = expect(pending).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(100);
    await rejected;
    const controller = new AbortController();
    const aborted = validateBackgroundMedia(gifBlob(), { signal: controller.signal });
    const cancellation = expect(aborted).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await cancellation;
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
});

it('preserves state when saving or restoring fails', async () => {
    saveBackgroundBlob.mockRejectedValueOnce(new Error('Database full'));
    const pending = changeBackground({ blob: gifBlob(), name: 'new.gif' });
    decoder.images[0].onload();
    await expect(pending).rejects.toThrow('Database full');
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
    deleteBackgroundBlob.mockRejectedValueOnce(new Error('Delete failed'));
    await expect(changeBackground()).rejects.toThrow('Delete failed');
    expect(useSettingsStore.getState().gifName).toBe('working.gif');
});

it('cancels an older upload when restore is requested during validation', async () => {
    const first = changeBackground({ blob: gifBlob(), name: 'old.gif' });
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    await changeBackground();
    await rejected;
    expect(saveBackgroundBlob).not.toHaveBeenCalled();
    expect(useSettingsStore.getState()).toMatchObject({ gifName: '', backgroundUrl: DEFAULT_BACKGROUND.url });
});

it('serializes an in-flight save before a newer restore so the old file cannot win', async () => {
    let finishSave;
    saveBackgroundBlob.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
    const first = changeBackground({ blob: gifBlob(), name: 'old.gif' });
    decoder.images[0].onload(); await flush();
    const restore = changeBackground(); await flush();
    expect(deleteBackgroundBlob).not.toHaveBeenCalled();
    finishSave();
    await Promise.all([first, restore]);
    expect(deleteBackgroundBlob).toHaveBeenCalledOnce();
    expect(useSettingsStore.getState()).toMatchObject({ backgroundUrl: DEFAULT_BACKGROUND.url, gifName: '' });
});

it('retains only the latest upload when two decoders race', async () => {
    const first = changeBackground({ blob: gifBlob(), name: 'old.gif' });
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const second = changeBackground({ blob: gifBlob(), name: 'new.gif' });
    decoder.images[1].onload();
    await Promise.all([rejected, second]);
    expect(saveBackgroundBlob).toHaveBeenCalledOnce();
    expect(useSettingsStore.getState().gifName).toBe('new.gif');
});

it('ignores errors from an old URL and recovers the current file even when deleting fails', async () => {
    expect(recoverBackground('blob:old')).toBe(false);
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:working');
    deleteBackgroundBlob.mockRejectedValueOnce(new Error('Denied'));
    expect(recoverBackground('blob:working')).toBe(true);
    await flush();
    expect(useSettingsStore.getState()).toMatchObject({ backgroundUrl: DEFAULT_BACKGROUND.url, gifName: '' });
    expect(recoverBackground(DEFAULT_BACKGROUND.url)).toBe(true);
    expect(useSettingsStore.getState()).toMatchObject({ backgroundUrl: null, backgroundIsVideo: false });
});
