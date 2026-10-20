import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompactLayout from '../components/CompactLayout';
import App from '../App';

vi.mock('../assets/logo.png', () => ({ default: 'logo.png' }));

const { mockSettings, mockUseSettingsStore } = vi.hoisted(() => {
    const s = {
        showWeatherWidget: true,
        showQuote: true,
        showSearchBox: true,
        showSpeedDial: true,
        showTop5Anime: true,
        showAnimeSidebar: true,
        showLofiPlayer: true,
        lofiStations: [{ id: 1, videoId: 'abc', name: 'Lofi 1' }],
        username: 'TestUser',
        backgroundUrl: '',
        backgroundIsVideo: false,
        use24hClock: true,
        clockMode: 'digital',
        customEngines: [],
        speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
        fallbackCity: 'London',
        useCelsius: true,
    };
    const fn = vi.fn((selector) => (typeof selector === 'function' ? selector(s) : s));
    fn.getState = vi.fn(() => s);
    return { mockSettings: s, mockUseSettingsStore: fn };
});

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: mockUseSettingsStore,
}));

vi.mock('../hooks/useWatchingList', () => ({ useWatchingList: () => [] }));
vi.mock('../hooks/useBackgroundLoader', () => ({ useBackgroundLoader: vi.fn() }));
vi.mock('../hooks/useThemeEffect', () => ({ useThemeEffect: vi.fn() }));
vi.mock('../hooks/useFontEffect', () => ({ useFontEffect: vi.fn() }));
vi.mock('../hooks/useWeather', () => ({ useWeather: () => ({ weather: null, error: false }) }));
vi.mock('../hooks/useAnimeSchedule', () => ({ useAnimeSchedule: () => ({
    displayList: [], todayLoading: false, todayError: false,
    sidebarData: [], sidebarLoading: false, sidebarError: false,
    activeDay: 'monday', setActiveDay: vi.fn(), userWatchingIds: [],
    expandedAnime: null, setExpandedAnime: vi.fn(),
}) }));

describe('Landscape Mode & Mobile Resolutions', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    const originalMatchMedia = window.matchMedia;

    const setViewport = (width, height, touch = true) => {
        window.innerWidth = width;
        window.innerHeight = height;
        window.matchMedia = vi.fn().mockImplementation((query) => {
            const widthLimit = query.match(/max-width: (\d+)px/)?.[1];
            const isHeightQuery = query.includes('max-height: 520px');
            const isTouchQuery = query.includes('hover: none') || query.includes('pointer: coarse');
            return {
                matches: (widthLimit && width <= Number(widthLimit)) || (isHeightQuery && height <= 520) || (isTouchQuery && touch),
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            };
        });
    };

    beforeEach(() => {
        Object.assign(mockSettings, {
            showWeatherWidget: true,
            showQuote: true,
            showSearchBox: true,
            showSpeedDial: true,
            showTop5Anime: true,
            showAnimeSidebar: true,
            showLofiPlayer: true,
            lofiStations: [{ id: 1, videoId: 'abc', name: 'Lofi 1' }],
            username: 'TestUser',
            backgroundUrl: '',
            backgroundIsVideo: false,
            use24hClock: true,
            clockMode: 'digital',
            customEngines: [],
            speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
            fallbackCity: 'London',
            useCelsius: true,
        });
    });

    afterEach(() => {
        window.innerWidth = originalInnerWidth;
        window.innerHeight = originalInnerHeight;
        window.matchMedia = originalMatchMedia;
        vi.restoreAllMocks();
    });

    const resolutions = [
        { name: 'iPhone SE (Landscape)', width: 667, height: 375 },
        { name: 'Samsung Galaxy S20 (Landscape)', width: 800, height: 360 },
        { name: 'iPhone 14 / 15 (Landscape)', width: 844, height: 390 },
        { name: 'iPhone 15 Pro Max (Landscape)', width: 932, height: 430 },
        { name: 'Pixel 7 (Landscape)', width: 915, height: 412 },
    ];

    resolutions.forEach(({ name, width, height }) => {
        it(`renders CompactLayout cleanly on ${name} (${width}x${height})`, () => {
            setViewport(width, height);
            const { container } = render(<CompactLayout tab="home" onTabChange={vi.fn()} />);

            expect(container.querySelector('.compact-root')).toBeTruthy();
            expect(container.querySelector('.top-nav')).toBeTruthy();
            expect(container.querySelector('.compact-home')).toBeTruthy();
            expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy();
        });
    });

    it('activates compact-mode body class on mobile landscape in App', () => {
        // iPhone 14 landscape (844x390)
        setViewport(844, 390);
        render(<App />);

        expect(document.body.classList.contains('compact-mode')).toBe(true);
    });

    it.each([[1180, 820], [1366, 1024], [1600, 1000]])(
        'keeps touch tablets in the compact shell at %ix%i', (width, height) => {
            setViewport(width, height);
            const { container } = render(<App />);
            expect(document.body.classList.contains('compact-mode')).toBe(true);
            expect(screen.getByRole('tab', { name: 'Settings' })).toBeTruthy();
            expect(container.querySelector('.interactive-ui')).toBeNull();
        },
    );

    it.each([[820, 1180], [1180, 820], [1200, 800]])('keeps tablet-sized mouse previews compact at %ix%i', (width, height) => {
        setViewport(width, height, false);
        const { container } = render(<App />);
        expect(container.querySelector('.compact-root')).toBeTruthy();
        expect(screen.getByRole('tab', { name: 'Settings' })).toBeTruthy();
    });

    it('keeps the desktop shell for a laptop with a mouse', () => {
        setViewport(1366, 820, false);
        const { container } = render(<App />);
        expect(container.querySelector('.interactive-ui')).toBeTruthy();
        expect(container.querySelector('.compact-root')).toBeNull();
    });
});
