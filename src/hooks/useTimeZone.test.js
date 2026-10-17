import { it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../stores/settingsSchema';
import { useTimeZone } from './useTimeZone';

const device = vi.hoisted(() => ({ zone: 'Europe/London' }));
vi.mock('../utils/timeZone', async importOriginal => ({ ...await importOriginal(), deviceTimeZone: () => device.zone }));

beforeEach(() => {
    vi.useFakeTimers(); device.zone = 'Europe/London';
    useSettingsStore.setState({ ...DEFAULT_SETTINGS });
    vi.spyOn(globalThis, 'setInterval');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('shares one detector and follows device changes on focus and periodic checks', () => {
    const first = renderHook(useTimeZone);
    const second = renderHook(useTimeZone);
    expect(first.result.current).toBe('Europe/London');
    expect(setInterval).toHaveBeenCalledTimes(1);
    act(() => { device.zone = 'Asia/Tokyo'; window.dispatchEvent(new Event('focus')); });
    expect(first.result.current).toBe('Asia/Tokyo');
    expect(second.result.current).toBe('Asia/Tokyo');
    act(() => { device.zone = 'America/New_York'; vi.advanceTimersByTime(60000); });
    expect(first.result.current).toBe('America/New_York');
    first.unmount(); second.unmount();
    expect(setInterval).toHaveBeenCalledTimes(1);
});

it('keeps a manual override stable and detects the current device zone when returning to automatic', () => {
    useSettingsStore.getState().setTimeZone('Asia/Kathmandu');
    const { result } = renderHook(useTimeZone);
    expect(result.current).toBe('Asia/Kathmandu');
    expect(setInterval).not.toHaveBeenCalled();
    act(() => { device.zone = 'Pacific/Auckland'; window.dispatchEvent(new Event('focus')); });
    expect(result.current).toBe('Asia/Kathmandu');
    act(() => useSettingsStore.getState().setTimeZone('auto'));
    expect(result.current).toBe('Pacific/Auckland');
});
