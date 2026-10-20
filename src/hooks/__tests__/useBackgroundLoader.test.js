import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { useBackgroundLoader } from '../useBackgroundLoader';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../../stores/settingsSchema';
import { DEFAULT_BACKGROUND } from '../../constants/background';
import { getBackgroundBlob, deleteBackgroundBlob } from '../../services/db';
import { gifBlob, mockMediaDecoder } from '../../testSupport/backgroundMedia';

vi.mock('../../services/db', () => ({ getBackgroundBlob: vi.fn(), deleteBackgroundBlob: vi.fn(), saveBackgroundBlob: vi.fn() }));
let decoder;
beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), backgroundUrl: null, backgroundIsVideo: false });
    let next = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:loaded-${++next}`);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    decoder = mockMediaDecoder();
    getBackgroundBlob.mockResolvedValue(null);
    deleteBackgroundBlob.mockResolvedValue();
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('loads a decoded saved image and marks it as an image', async () => {
    getBackgroundBlob.mockResolvedValue(gifBlob());
    renderHook(() => useBackgroundLoader());
    await waitFor(() => expect(useSettingsStore.getState().backgroundUrl).toBe('blob:loaded-2'));
    expect(useSettingsStore.getState().backgroundIsVideo).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:loaded-1');
});

it('loads a saved video only after its first frame decodes', async () => {
    getBackgroundBlob.mockResolvedValue(new Blob(['video'], { type: 'video/mp4' }));
    renderHook(() => useBackgroundLoader());
    await waitFor(() => expect(useSettingsStore.getState().backgroundIsVideo).toBe(true));
    expect(decoder.videos).toHaveLength(1);
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:loaded-2');
});

it('uses the default video when there is no saved background', async () => {
    renderHook(() => useBackgroundLoader());
    await waitFor(() => expect(useSettingsStore.getState().backgroundUrl).toBe(DEFAULT_BACKGROUND.url));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('recovers a damaged saved background and removes the broken file', async () => {
    getBackgroundBlob.mockResolvedValue(new Blob([], { type: 'image/png' }));
    useSettingsStore.setState({ gifName: 'broken.png' });
    const { result } = renderHook(() => useBackgroundLoader());
    await waitFor(() => expect(result.current.backgroundError).toContain('default background'));
    expect(useSettingsStore.getState()).toMatchObject({ backgroundUrl: DEFAULT_BACKGROUND.url, gifName: '', backgroundIsVideo: true });
    expect(deleteBackgroundBlob).toHaveBeenCalledOnce();
});

it('does not replace a newer selection when a saved background finishes loading late', async () => {
    let finish;
    getBackgroundBlob.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    renderHook(() => useBackgroundLoader());
    act(() => useSettingsStore.setState({ backgroundUrl: 'blob:new-upload', backgroundIsVideo: false }));
    await act(async () => finish(gifBlob()));
    expect(useSettingsStore.getState().backgroundUrl).toBe('blob:new-upload');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('does not publish a background after unmount', async () => {
    let finish;
    getBackgroundBlob.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    const { unmount } = renderHook(() => useBackgroundLoader());
    unmount();
    await act(async () => finish(gifBlob()));
    expect(useSettingsStore.getState().backgroundUrl).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
});

it('revokes replaced blob URLs without revoking the active URL during StrictMode remount', async () => {
    useSettingsStore.setState({ backgroundUrl: 'blob:active' });
    let unmount;
    await act(async () => { ({ unmount } = renderHook(() => useBackgroundLoader(), { wrapper: StrictMode })); });
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:active');
    await act(async () => useSettingsStore.setState({ backgroundUrl: 'blob:next' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:active');
    unmount();
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:next');
});

it('recovers runtime playback errors, ignores obsolete events, and stops retrying a broken default', async () => {
    useSettingsStore.setState({ backgroundUrl: 'blob:active', backgroundIsVideo: true });
    let result;
    await act(async () => { ({ result } = renderHook(() => useBackgroundLoader())); });
    await act(async () => result.current.handleBackgroundError('blob:obsolete'));
    expect(result.current.backgroundError).toBe('');
    await act(async () => result.current.handleBackgroundError('blob:active'));
    expect(useSettingsStore.getState().backgroundUrl).toBe(DEFAULT_BACKGROUND.url);
    expect(result.current.backgroundError).toContain('default background');
    await act(async () => result.current.handleBackgroundError(DEFAULT_BACKGROUND.url));
    expect(useSettingsStore.getState().backgroundUrl).toBeNull();
    expect(result.current.backgroundError).toContain('Background unavailable');
});
