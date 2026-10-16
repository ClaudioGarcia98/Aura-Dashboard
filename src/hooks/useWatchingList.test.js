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
it('marks RSS fallback as partial rather than verified', async () => {
    const items = [{ mal_id: 1, title: 'Recent activity' }];
    Object.defineProperty(items, 'partial', { value: true });
    fetchUserWatchingList.mockResolvedValue(items);
    renderHook(() => useWatchingList('partial', true, actions));
    await advance();
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('partial');
    expect(actions.setMalSuccess).toHaveBeenLastCalledWith(false);
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

it('refetches with cache bypass when the user requests a retry', async () => {
    fetchUserWatchingList.mockResolvedValue([]);
    const { rerender } = renderHook(({ refreshKey }) => useWatchingList('retry', true, { ...actions, refreshKey }), { initialProps: { refreshKey: 0 } });
    await advance();
    rerender({ refreshKey: 1 });
    await advance();
    expect(fetchUserWatchingList).toHaveBeenCalledTimes(2);
    expect(fetchUserWatchingList).toHaveBeenLastCalledWith('retry', expect.objectContaining({ force: true }));
});

it('keeps a saved complete list when only partial activity is available', async () => {
    const saved = { username: 'saved', partial: false, data: [{ mal_id: 2, title: 'Older watching title' }] };
    localStorage.setItem(WATCHING_CACHE_KEY, JSON.stringify(saved));
    const partial = [{ mal_id: 1, title: 'Recent activity' }];
    Object.defineProperty(partial, 'partial', { value: true });
    fetchUserWatchingList.mockResolvedValue(partial);
    const { result } = renderHook(() => useWatchingList('saved', true, actions));
    await advance();
    expect(result.current).toEqual(saved.data);
    expect(JSON.parse(localStorage.getItem(WATCHING_CACHE_KEY))).toEqual(saved);
    expect(actions.setMalStatus).toHaveBeenLastCalledWith('stale');
});
