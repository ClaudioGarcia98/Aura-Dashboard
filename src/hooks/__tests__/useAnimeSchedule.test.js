import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useAnimeSchedule, getPortugalDayFilter } from '../useAnimeSchedule';
import { fetchDaySchedule } from '../../services/animeService';

vi.mock('zustand/react/shallow', () => ({
    useShallow: (f) => f,
}));

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        const mockSettings = {
            malUsername: 'test',
            setMalError: vi.fn(),
            setMalLoading: vi.fn(),
            setMalSuccess: vi.fn(),
            volume: 0.5,
        };
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

vi.mock('../../services/animeService', () => ({
    fetchDaySchedule: vi.fn(),
    fetchUserWatchingList: vi.fn().mockResolvedValue([]),
}));

describe('useAnimeSchedule hook', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('getPortugalDayFilter returns a valid weekday', () => {
        const day = getPortugalDayFilter();
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        expect(validDays).toContain(day);
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
});
