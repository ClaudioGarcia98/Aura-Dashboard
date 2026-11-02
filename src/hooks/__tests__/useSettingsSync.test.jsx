import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSettingsSync } from '../useSettingsSync';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../../stores/settingsSchema';

beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ ...structuredClone(DEFAULT_SETTINGS), backgroundUrl: 'blob:local', malStatus: 'loading' });
});
afterEach(() => vi.restoreAllMocks());

function receiveSettings(state) {
    localStorage.setItem('dash_settings', JSON.stringify({ version: 1, state }));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'dash_settings', storageArea: localStorage })));
}

it('updates preferences from another tab, preserves local media and status, and never echoes the change', () => {
    renderHook(() => useSettingsSync());
    const write = vi.spyOn(Storage.prototype, 'setItem');
    receiveSettings({ username: 'Other tab', theme: 'nord', volume: 0.8, backgroundUrl: 'blob:foreign', setUsername: 'injected' });
    expect(useSettingsStore.getState()).toMatchObject({ username: 'Other tab', theme: 'nord', volume: 0.8, backgroundUrl: 'blob:local', malStatus: 'loading' });
    expect(typeof useSettingsStore.getState().setUsername).toBe('function');
    expect(write).toHaveBeenCalledTimes(1);
});

it('reads the newest saved settings instead of an obsolete queued storage event', () => {
    renderHook(() => useSettingsSync());
    localStorage.setItem('dash_settings', JSON.stringify({ version: 1, state: { username: 'Newest' } }));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'dash_settings', newValue: JSON.stringify({ version: 1, state: { username: 'Obsolete' } }) })));
    expect(useSettingsStore.getState().username).toBe('Newest');
});

it('catches up when a suspended tab gains focus and resets preferences when data is cleared', () => {
    renderHook(() => useSettingsSync());
    localStorage.setItem('dash_settings', JSON.stringify({ version: 1, state: { username: 'Changed while asleep' } }));
    act(() => window.dispatchEvent(new Event('focus')));
    expect(useSettingsStore.getState().username).toBe('Changed while asleep');
    localStorage.clear();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
    expect(useSettingsStore.getState().username).toBe('');
    expect(write).not.toHaveBeenCalled();
});

it('ignores malformed or future-version settings and stops syncing after unmount', () => {
    useSettingsStore.getState().setUsername('Keep');
    const { unmount } = renderHook(() => useSettingsSync());
    for (const raw of ['broken', 'null', JSON.stringify({ version: 99, state: { username: 'Future' } })]) {
        localStorage.setItem('dash_settings', raw);
        act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'dash_settings' })));
        expect(useSettingsStore.getState().username).toBe('Keep');
    }
    unmount();
    receiveSettings({ username: 'Unmounted' });
    expect(useSettingsStore.getState().username).toBe('Keep');
});
