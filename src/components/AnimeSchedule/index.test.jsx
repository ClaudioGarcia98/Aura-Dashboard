import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnimeSchedule from './index';

let mockSettings = { showTop5Anime: true, showAnimeSidebar: true, volume: 0.5 };
let mockScheduleState;

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

vi.mock('../../hooks/useAnimeSchedule', () => ({
    useAnimeSchedule: () => mockScheduleState,
}));

describe('AnimeSchedule Component', () => {
    beforeEach(() => {
        mockSettings = { showTop5Anime: true, showAnimeSidebar: true, volume: 0.5 };
        mockScheduleState = {
            displayList: [{ mal_id: 1, title: 'Frieren: Beyond Journey\'s End', score: 9.3 }],
            todayLoading: false,
            todayError: false,
            userWatchingIds: [],
            activeDay: 'monday',
            setActiveDay: vi.fn(),
            sidebarData: [],
            sidebarLoading: false,
            sidebarError: false,
            expandedAnime: null,
            setExpandedAnime: vi.fn(),
            previewTrailer: null,
            previewPos: { x: 0, y: 0 },
            handleMouseEnter: vi.fn(),
            handleMouseLeave: vi.fn(),
            handleTrailerMouseEnter: vi.fn(),
            handleTrailerMouseLeave: vi.fn(),
            trailerMuted: true,
            handleUnmute: vi.fn(),
            handleMute: vi.fn(),
            trailerIframeRef: { current: null },
            isSidebarOpen: false,
            setIsSidebarOpen: vi.fn(),
            toggleRef: { current: null },
            sidebarRef: { current: null },
            todayFilter: 'monday',
        };

        // Create mainUi portal target for tests
        if (!document.getElementById('mainUi')) {
            const mainUi = document.createElement('div');
            mainUi.id = 'mainUi';
            document.body.appendChild(mainUi);
        }
    });

    it('renders today anime box when showTop5Anime is true', () => {
        render(<AnimeSchedule />);
        expect(screen.getByText("Today's Launch")).toBeTruthy();
        expect(screen.getByText("Frieren: Beyond Journey's End")).toBeTruthy();
    });

    it('does not render today anime box when showTop5Anime is false', () => {
        mockSettings.showTop5Anime = false;
        render(<AnimeSchedule />);
        expect(screen.queryByText("Today's Launch")).toBeNull();
    });

    it('renders skeleton cards while todayLoading is true', () => {
        mockScheduleState.todayLoading = true;
        mockScheduleState.displayList = [];
        const { container } = render(<AnimeSchedule />);

        expect(container.querySelectorAll('.skeleton-card').length).toBe(5);
    });

    it('renders error message when todayError is true', () => {
        mockScheduleState.todayError = true;
        render(<AnimeSchedule />);

        expect(screen.getByText(/Couldn't connect to MyAnimeList right now/i)).toBeTruthy();
    });

    it('renders empty message when displayList is empty and not loading', () => {
        mockScheduleState.displayList = [];
        mockScheduleState.todayLoading = false;
        render(<AnimeSchedule />);

        expect(screen.getByText('No anime airing today.')).toBeTruthy();
    });

    it('renders trailer preview portal when previewTrailer is present', () => {
        mockScheduleState.previewTrailer = 'dQw4w9WgXcQ';
        mockScheduleState.previewPos = { x: 100, y: 150 };

        render(<AnimeSchedule />);
        expect(screen.getByTitle('Anime Trailer Preview')).toBeTruthy();
    });
});
