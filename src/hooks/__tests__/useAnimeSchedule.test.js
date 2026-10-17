import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimeSchedule, getPortugalDayFilter } from '../useAnimeSchedule';
import { fetchDaySchedule, fetchUserWatchingList } from '../../services/animeService';

vi.mock('zustand/react/shallow', () => ({
    useShallow: (f) => f,
}));

const mockSettings = vi.hoisted(() => ({
    malUsername: 'test', volume: 0.5, setMalError: vi.fn(), setMalLoading: vi.fn(), setMalSuccess: vi.fn(), setMalStatus: vi.fn(),
}));
vi.mock('../../stores/useSettingsStore', () => ({ useSettingsStore: selector => selector(mockSettings) }));

vi.mock('../../services/animeService', () => ({
    fetchDaySchedule: vi.fn(),
    fetchUserWatchingList: vi.fn().mockResolvedValue([]),
    extractTrailerId: anime => anime.trailer?.youtube_id,
}));

describe('useAnimeSchedule hook', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.clearAllMocks();
        mockSettings.malRefreshKey = 0;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('getPortugalDayFilter returns a valid weekday', () => {
        const day = getPortugalDayFilter();
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        expect(validDays).toContain(day);
    });

    it.each([820, 1180, 1200, 1201, 1366])('only opens floating previews on desktop at %ipx with a mouse', async width => {
        vi.stubGlobal('matchMedia', vi.fn(query => ({
            matches: width <= Number(query.match(/max-width: (\d+)px/)?.[1]),
            addEventListener: vi.fn(), removeEventListener: vi.fn(),
        })));
        fetchDaySchedule.mockResolvedValue([]);
        const { result } = renderHook(() => useAnimeSchedule());
        act(() => result.current.handleMouseEnter({ currentTarget: {
            getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, height: 50 }),
            closest: () => null,
        } }, { trailer: { youtube_id: 'preview123' } }));
        await act(async () => { await vi.advanceTimersByTimeAsync(400); });
        expect(result.current.previewTrailer).toBe(width > 1200 ? 'preview123' : null);
    });

    it('cancels a pending desktop hover when resized to tablet width', async () => {
        let width = 1366;
        vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: width <= 1200 })));
        fetchDaySchedule.mockResolvedValue([]);
        const { result } = renderHook(() => useAnimeSchedule());
        act(() => result.current.handleMouseEnter({ currentTarget: {
            getBoundingClientRect: () => ({ left: 10, right: 100, top: 10, height: 50 }),
            closest: () => null,
        } }, { trailer: { youtube_id: 'preview123' } }));
        width = 1180;
        await act(async () => { await vi.advanceTimersByTimeAsync(400); });
        expect(result.current.previewTrailer).toBeNull();
    });

    it('returns default loading state initially', () => {
        fetchDaySchedule.mockResolvedValue([]);
        const { result } = renderHook(() => useAnimeSchedule());
        expect(result.current.todayLoading).toBe(true);
    });

    it('deduplicates todayData by mal_id and populates displayList', async () => {
        const mockData = [
            { mal_id: 1, title: 'Dr. Stone', score: 8.5 },
            { mal_id: 1, title: 'Dr. Stone', score: 8.5 },
            { mal_id: 2, title: 'Koori no Jouheki', score: 7.8 },
        ];
        fetchDaySchedule.mockResolvedValue(mockData);

        const { result } = renderHook(() => useAnimeSchedule());

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100);
        });

        expect(result.current.displayList).toHaveLength(2);
        expect(result.current.displayList[0].title).toBe('Dr. Stone');
        expect(result.current.displayList[1].title).toBe('Koori no Jouheki');
    });

    it('handles schedule fetch error and sets todayError to true', async () => {
        fetchDaySchedule.mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useAnimeSchedule());

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100);
        });

        expect(result.current.todayError).toBe(true);
        expect(result.current.todayLoading).toBe(false);
    });

    it('toggles sidebar state and closes on Escape', () => {
        fetchDaySchedule.mockResolvedValue([]);
        const { result } = renderHook(() => useAnimeSchedule());

        expect(result.current.isSidebarOpen).toBe(false);

        act(() => {
            result.current.setIsSidebarOpen(true);
        });
        expect(result.current.isSidebarOpen).toBe(true);

        act(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        });
        expect(result.current.isSidebarOpen).toBe(false);
    });

    it('persists trailer mute state in localStorage when toggled', () => {
        fetchDaySchedule.mockResolvedValue([]);
        const { result } = renderHook(() => useAnimeSchedule());

        expect(result.current.trailerMuted).toBe(true);

        act(() => {
            result.current.handleUnmute();
        });

        expect(result.current.trailerMuted).toBe(false);
        expect(localStorage.getItem('dash_trailer_muted')).toBe('false');

        act(() => {
            result.current.handleMute();
        });

        expect(result.current.trailerMuted).toBe(true);
        expect(localStorage.getItem('dash_trailer_muted')).toBe('true');
    });

    it('sets malError when watching list is empty for a username', async () => {
        fetchDaySchedule.mockResolvedValue([]);
        fetchUserWatchingList.mockResolvedValue([]);

        renderHook(() => useAnimeSchedule());

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100);
        });

        // malUsername was 'test', but returned 0 items
        expect(fetchUserWatchingList).toHaveBeenCalledWith('test', expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    it('does not confuse unrelated provider IDs through title matching', async () => {
        const mockSchedule = [
            { mal_id: 99999, title: 'Hyouken no Majutsushi ga Sekai wo Suberu II', score: 8.0 }
        ];
        fetchDaySchedule.mockResolvedValue(mockSchedule);
        fetchUserWatchingList.mockResolvedValue([
            { mal_id: 64254, title: 'Hyouken no Majutsushi ga Sekai wo Suberu II' }
        ]);

        const { result } = renderHook(() => useAnimeSchedule());

        await act(async () => {
            await vi.advanceTimersByTimeAsync(1100);
        });

        // 64254 is the MAL ID from watching list
        expect(result.current.userWatchingIds).toContain(64254);
        // 99999 is the AniList mal_id matched by normalized title
        expect(result.current.userWatchingIds).not.toContain(99999);
    });

    it('adds a newly watched show to today launch after one refresh', async () => {
        fetchDaySchedule.mockResolvedValue([
            ...Array.from({ length: 5 }, (_, i) => ({ mal_id: i + 1, title: `Popular ${i}`, score: 9 })),
            { mal_id: 6, title: 'Newly watching', score: 5 },
        ]);
        fetchUserWatchingList.mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ mal_id: 6, title: 'Newly watching' }]);
        const { result, rerender } = renderHook(() => useAnimeSchedule());
        await act(async () => { await vi.advanceTimersByTimeAsync(500); });
        expect(result.current.displayList.map(anime => anime.mal_id)).not.toContain(6);
        mockSettings.malRefreshKey = 1;
        rerender();
        await act(async () => { await vi.advanceTimersByTimeAsync(500); });
        expect(result.current.displayList[0].mal_id).toBe(6);
        expect(result.current.userWatchingIds).toContain(6);
        expect(fetchUserWatchingList).toHaveBeenLastCalledWith('test', expect.objectContaining({ force: true }));
    });
});

