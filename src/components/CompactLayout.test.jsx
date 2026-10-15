import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CompactLayout from './CompactLayout';

vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

vi.mock('zustand/react/shallow', () => ({
    useShallow: (f) => f,
}));

let mockSettings = {
    showWeatherWidget: true,
    showQuote: true,
    showSearchBox: true,
    showSpeedDial: true,
    showTop5Anime: true,
    showAnimeSidebar: true,
    showLofiPlayer: true,
    lofiStations: [{ id: 1, videoId: 'abc', name: 'Lofi 1' }],
};

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

vi.mock('../hooks/useAnimeSchedule', () => ({
    useAnimeSchedule: vi.fn(() => ({
        displayList: [],
        todayLoading: false,
        todayError: null,
        activeDay: 'monday',
        setActiveDay: vi.fn(),
        sidebarData: [],
        sidebarLoading: false,
        sidebarError: null,
        expandedAnime: null,
        setExpandedAnime: vi.fn(),
        userWatchingIds: [],
        handleMouseEnter: vi.fn(),
        handleMouseLeave: vi.fn(),
        previewTrailer: null,
        previewPos: { top: 0, left: 0 },
        trailerMuted: true,
        handleMute: vi.fn(),
        handleUnmute: vi.fn(),
        handleTrailerMouseEnter: vi.fn(),
        handleTrailerMouseLeave: vi.fn(),
        trailerIframeRef: { current: null },
    })),
}));

vi.mock('./Greeting', () => ({ default: () => <div data-testid="compact-greeting">Greeting</div> }));
vi.mock('./Clock', () => ({ default: () => <div data-testid="compact-clock">Clock</div> }));
vi.mock('./Quote', () => ({ default: () => <div data-testid="compact-quote">Quote</div> }));
vi.mock('./SearchBox', () => ({ default: () => <div data-testid="compact-searchbox">SearchBox</div> }));
vi.mock('./WeatherWidget', () => ({ default: () => <div data-testid="compact-weather">Weather</div> }));
vi.mock('./SpeedDial', () => ({ default: () => <div data-testid="compact-speeddial">SpeedDial</div> }));
vi.mock('./SettingsPanel/index.jsx', () => ({ default: ({ embedded }) => <div data-testid="compact-settings-panel" data-embedded={embedded ? 'true' : 'false'}>Settings</div> }));
vi.mock('./AnimeSchedule/TodayLaunch', () => ({ default: () => <div data-testid="compact-today-launch">TodayLaunch</div> }));
vi.mock('./AnimeSchedule/EmbeddedAnimeList', () => ({ default: () => <div data-testid="compact-anime-list">EmbeddedAnimeList</div> }));
vi.mock('./LofiPlayer', () => ({ default: ({ compact, expanded }) => <div data-testid="compact-lofi" data-compact={compact ? 'true' : 'false'} data-expanded={expanded ? 'true' : 'false'}>Lofi</div> }));

describe('CompactLayout', () => {
    beforeEach(() => {
        mockSettings = {
            showWeatherWidget: true,
            showQuote: true,
            showSearchBox: true,
            showSpeedDial: true,
            showTop5Anime: true,
            showAnimeSidebar: true,
            showLofiPlayer: true,
            lofiStations: [{ id: 1, videoId: 'abc', name: 'Lofi 1' }],
        };
    });

    it('renders the TopNav and default Home tab', () => {
        render(<CompactLayout />);
        expect(screen.getByRole('tab', { name: 'Home' }).getAttribute('aria-selected')).toBe('true');
        expect(screen.getByTestId('compact-greeting')).toBeTruthy();
        expect(screen.getByTestId('compact-clock')).toBeTruthy();
        expect(screen.getByTestId('compact-weather')).toBeTruthy();
        expect(screen.getByTestId('compact-today-launch')).toBeTruthy();
    });

    it('switches to Settings tab when Settings tab button is clicked', () => {
        render(<CompactLayout />);
        const settingsTab = screen.getByRole('tab', { name: 'Settings' });
        fireEvent.click(settingsTab);

        expect(settingsTab.getAttribute('aria-selected')).toBe('true');
        const settingsPanel = screen.getByTestId('compact-settings-panel');
        expect(settingsPanel).toBeTruthy();
        expect(settingsPanel.getAttribute('data-embedded')).toBe('true');
    });

    it('switches to Anime tab when Anime tab button is clicked', () => {
        render(<CompactLayout />);
        const animeTab = screen.getByRole('tab', { name: 'Anime' });
        fireEvent.click(animeTab);

        expect(animeTab.getAttribute('aria-selected')).toBe('true');
        expect(screen.getByTestId('compact-anime-list')).toBeTruthy();
    });

    it('omits Anime tab when showAnimeSidebar is disabled', () => {
        mockSettings.showAnimeSidebar = false;
        render(<CompactLayout />);
        expect(screen.queryByRole('tab', { name: 'Anime' })).toBeNull();
    });

    it('omits Lofi tab when lofiStations is empty', () => {
        mockSettings.lofiStations = [];
        render(<CompactLayout />);
        expect(screen.queryByRole('tab', { name: 'Lofi' })).toBeNull();
    });

    it('switches to settings on open-settings-dials custom event', () => {
        render(<CompactLayout />);
        expect(screen.getByRole('tab', { name: 'Home' }).getAttribute('aria-selected')).toBe('true');

        act(() => {
            window.dispatchEvent(new CustomEvent('open-settings-dials'));
        });

        expect(screen.getByRole('tab', { name: 'Settings' }).getAttribute('aria-selected')).toBe('true');
    });
});
