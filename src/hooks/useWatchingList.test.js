import { renderHook, act } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { useWatchingList } from './useWatchingList';
import { fetchUserWatchingList } from '../services/animeService';
import { WATCHING_CACHE_KEY } from '../services/api';

vi.mock('../services/animeService', () => ({ fetchUserWatchingList: vi.fn() }));
const actions = { setMalLoading: vi.fn(), setMalError: vi.fn(), setMalSuccess: vi.fn(), setMalStatus: vi.fn() };
beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); vi.clearAllMocks(); });
afterEach(() => { vi.useRealTimers(); });
const advance = () => act(async () => { await vi.advanceTimersByTimeAsync(500); });

it('ignores an old username response in both the UI and persisted cache', async () => {
    let finishOld;
    fetchUserWatchingList.mockImplementation(name => name === 'old' ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve([{ mal_id: 2, title: 'New list' }]));
    const { result, rerender } = renderHook(({ name }) => useWatchingList(name, true, actions), { initialProps: { name: 'old' } });
    await advance();
    rerender({ name: 'new' });
    await advance();
    await act(async () => { finishOld([{ mal_id: 1, title: 'Old list' }]); });
    expect(result.current).toEqual([{ mal_id: 2, title: 'New list' }]);
    expect(JSON.parse(localStorage.getItem(WATCHING_CACHE_KEY)).username).toBe('new');
});
it('accepts a verified empty list without calling it a username error', async () => {
    fetchUserWatchingList.mockResolvedValue([]);
    renderHook(() => useWatchingList('empty', true, actions));
    await advance();
    expect(actions.setMalSuccess).toHaveBeenLastCalledWith(true);
    expect(actions.setMalError).toHaveBeenLastCalledWith(false);
});
it('retains a matching saved list with a stale status during an outage', async () => {
    localStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify({ username: 'saved', data: [{ mal_id: 1, title: 'Saved show' }] }));
    fetchUserWatchingList.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useWatchingList('saved', true, actions));
    await advance();
    expect(result.current[0].title).toBe('Saved show');
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('stale');
});
it('does not fetch or reuse other-user data when disabled', async () => {
    const { result } = renderHook(() => useWatchingList('disabled', false, actions));
    await advance();
    expect(fetchUserWatchingList).not.toHaveBeenCalled();
    expect(result.current).toEqual([]);
});

it('refetches with cache bypass when the user requests a retry without forcing later username changes', async () => {
    fetchUserWatchingList.mockResolvedValue([]);
    const { rerender } = renderHook(({ name, refreshKey }) => useWatchingList(name, true, { ...actions, refreshKey }), { initialProps: { name: 'retry', refreshKey: 0 } });
    await advance();
    rerender({ name: 'retry', refreshKey: 1 });
    await advance();
    expect(fetchUserWatchingList).toHaveBeenCalledTimes(2);
    expect(fetchUserWatchingList).toHaveBeenLastCalledWith('retry', expect.objectContaining({ force: true }));
    rerender({ name: 'another', refreshKey: 1 });
    await advance();
    expect(fetchUserWatchingList).toHaveBeenLastCalledWith('another', expect.objectContaining({ force: false }));
});

it('rejects legacy partial cache entries and removes old custom proxy storage', async () => {
    localStorage.setItem('dash_mal_proxy', 'https://legacy.example');
    localStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify({ username: 'legacy', partial: true, data: [{ mal_id: 1, title: 'Old RSS item' }] }));
    fetchUserWatchingList.mockRejectedValue(new Error('Offline'));
    const { result } = renderHook(() => useWatchingList('legacy', true, actions));
    await advance();
    expect(result.current).toEqual([]);
    expect(localStorage.getItem('dash_mal_proxy')).toBeNull();
    expect(localStorage.getItem(WATCHING_CACHE_KEY)).toBeNull();
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('error');
});

it('restores a previous username complete saved list when switching back during an outage', async () => {
    fetchUserWatchingList
        .mockResolvedValueOnce([{ mal_id: 10, title: 'Alice Show' }])
        .mockResolvedValueOnce([{ mal_id: 20, title: 'Bob Show' }])
        .mockRejectedValueOnce(new Error('Offline'));
    const { result, rerender } = renderHook(({ name }) => useWatchingList(name, true, actions), { initialProps: { name: 'alice' } });
    await advance();
    expect(result.current).toEqual([{ mal_id: 10, title: 'Alice Show' }]);
    rerender({ name: 'bob' });
    await advance();
    expect(result.current).toEqual([{ mal_id: 20, title: 'Bob Show' }]);
    rerender({ name: 'alice' });
    await advance();
    expect(result.current).toEqual([{ mal_id: 10, title: 'Alice Show' }]);
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('stale');
});

it('distinguishes rate-limited and unavailable upstream errors when no saved list exists', async () => {
    const rateErr = Object.assign(new Error('HTTP 429'), { status: 429 });
    fetchUserWatchingList.mockRejectedValueOnce(rateErr);
    const { rerender } = renderHook(({ name }) => useWatchingList(name, true, actions), { initialProps: { name: 'user1' } });
    await advance();
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('rate_limited');

    const timeoutErr = new Error('Request timed out');
    fetchUserWatchingList.mockRejectedValueOnce(timeoutErr);
    rerender({ name: 'user2' });
    await advance();
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('unavailable');
});
