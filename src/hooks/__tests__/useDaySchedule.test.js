import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDaySchedule } from '../useDaySchedule';
import { fetchDaySchedule } from '../../services/animeService';

vi.mock('../../services/animeService', () => ({ fetchDaySchedule: vi.fn() }));
const show = { mal_id: 1, title: 'Recovered show' };
const options = { day: 'monday', date: '2026-10-19', timeZone: 'UTC', enabled: true };
const settle = async (ms = 0) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-19T12:00:00Z')); vi.resetAllMocks();
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('recovers on online after a transient same-day failure and coalesces recovery events', async () => {
    fetchDaySchedule.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useDaySchedule(options));
    await settle(35000);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(3);
    expect(result.current.error).toBe(true);
    fetchDaySchedule.mockResolvedValue([show]);
    await settle(30000);
    await act(async () => {
        window.dispatchEvent(new Event('online'));
        window.dispatchEvent(new Event('focus'));
        document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(fetchDaySchedule).toHaveBeenCalledTimes(4);
    expect(result.current.data).toEqual([show]);
    expect(result.current.error).toBe(false);
});

it('bounds automatic retries and throttles repeated failed resume attempts', async () => {
    fetchDaySchedule.mockRejectedValue(new Error('Offline'));
    renderHook(() => useDaySchedule(options));
    await settle(35000);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(3);
    await act(async () => { for (let i = 0; i < 5; i++) window.dispatchEvent(new Event('focus')); });
    expect(fetchDaySchedule).toHaveBeenCalledTimes(3);
    await settle(3600000);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(6);
    await settle(3600000);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(6);
});

it('defers an online signal during cooldown rather than losing recovery after the final retry', async () => {
    fetchDaySchedule.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useDaySchedule(options));
    await settle(35000);
    fetchDaySchedule.mockResolvedValue([show]);
    await settle(5000);
    act(() => { window.dispatchEvent(new Event('online')); });
    await settle(24999);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(3);
    await settle(1);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(4);
    expect(result.current.error).toBe(false);
});

it('refreshes a stale saved schedule without dropping it during recovery', async () => {
    const saved = Object.assign([show], { stale: true });
    fetchDaySchedule.mockResolvedValueOnce(saved).mockResolvedValueOnce([{ ...show, title: 'Live show' }]);
    const { result } = renderHook(() => useDaySchedule(options));
    await settle();
    expect(result.current.stale).toBe(true);
    expect(result.current.data).toEqual([show]);
    await settle(5000);
    expect(result.current.data[0].title).toBe('Live show');
    expect(result.current.stale).toBe(false);
});

it('refreshes healthy data after its TTL and refreshes on same-day resume after sleep', async () => {
    fetchDaySchedule.mockResolvedValue([show]);
    renderHook(() => useDaySchedule(options));
    await settle();
    await settle(3600000);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date(Date.now() + 3600001));
    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(fetchDaySchedule).toHaveBeenCalledTimes(3);
});

it('keeps the original timestamp of a 59-minute-old cache and refreshes after one minute', async () => {
    const cached = Object.assign([show], { savedAt: Date.now() - 59 * 60000 });
    fetchDaySchedule.mockResolvedValueOnce(cached).mockResolvedValue([show]);
    renderHook(() => useDaySchedule(options));
    await settle(59999);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(1);
    await settle(1);
    expect(fetchDaySchedule).toHaveBeenCalledTimes(2);
});

it('exposes a force refresh and ignores concurrent refresh clicks', async () => {
    let resolve;
    fetchDaySchedule.mockResolvedValueOnce([show]).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useDaySchedule(options));
    await settle();
    act(() => { result.current.refresh(); result.current.refresh(); });
    expect(fetchDaySchedule).toHaveBeenCalledTimes(2);
    expect(fetchDaySchedule).toHaveBeenLastCalledWith('monday', expect.objectContaining({ force: true }));
    await act(async () => { resolve([]); });
    expect(result.current.data).toEqual([]);
});

it('aborts old requests on disable/date changes and ignores late results', async () => {
    let resolveOld;
    fetchDaySchedule.mockImplementationOnce(() => new Promise(done => { resolveOld = done; })).mockResolvedValue([]);
    const { result, rerender, unmount } = renderHook(props => useDaySchedule(props), { initialProps: options });
    await settle();
    const oldSignal = fetchDaySchedule.mock.calls[0][1].signal;
    rerender({ ...options, day: 'tuesday', date: '2026-10-20' });
    await settle();
    expect(oldSignal.aborted).toBe(true);
    await act(async () => { resolveOld([show]); });
    expect(result.current.data).toEqual([]);
    rerender({ ...options, enabled: false });
    const calls = fetchDaySchedule.mock.calls.length;
    await settle(3600000);
    window.dispatchEvent(new Event('online'));
    expect(fetchDaySchedule).toHaveBeenCalledTimes(calls);
    unmount();
    expect(fetchDaySchedule.mock.calls.at(-1)[1].signal.aborted).toBe(true);
});
