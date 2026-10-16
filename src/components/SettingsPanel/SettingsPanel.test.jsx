import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsPanel from './index';

let spState;

vi.mock('../../stores/useSettingsStore', () => {
    const useSettingsStore = vi.fn((selector) =>
        typeof selector === 'function' ? selector(spState) : spState
    );
    useSettingsStore.getState = vi.fn(() => spState);
    return { useSettingsStore };
});

describe('SettingsPanel', () => {
    beforeEach(() => {
        localStorage.clear();
        spState = {
            theme: 'aurora', setTheme: vi.fn(),
            font: 'default', setFont: vi.fn(),
            clockMode: 'digital', setClockMode: vi.fn(),
            username: 'TestUser', setUsername: vi.fn(),
            malUsername: '', setMalUsername: vi.fn(),
            malError: false, malLoading: false, malSuccess: false,
            setMalError: vi.fn(), setMalLoading: vi.fn(), setMalSuccess: vi.fn(),
            speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
            setSpeedDials: vi.fn(),
            volume: 0.5, setVolume: vi.fn(),
            gifName: '', setGifName: vi.fn(),
            setBackgroundUrl: vi.fn(), setBackgroundIsVideo: vi.fn(),
            use24hClock: true, setUse24hClock: vi.fn(),
            useCelsius: true, setUseCelsius: vi.fn(),
            fallbackCity: 'Lisbon', setFallbackCity: vi.fn(),
            lofiId: 'Gu-g8FRG4Zs', setLofiId: vi.fn(),
            lofiStations: [{ id: 1, videoId: 'Gu-g8FRG4Zs', name: 'Anime Lofi' }],
            setLofiStations: vi.fn(),
            showWeatherWidget: true, setShowWeatherWidget: vi.fn(),
            showQuote: true, setShowQuote: vi.fn(),
            showSearchBox: true, setShowSearchBox: vi.fn(),
            showSpeedDial: true, setShowSpeedDial: vi.fn(),
            showTop5Anime: true, setShowTop5Anime: vi.fn(),
            showAnimeSidebar: true, setShowAnimeSidebar: vi.fn(),
            showLofiPlayer: true, setShowLofiPlayer: vi.fn(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('opens panel when toggle is clicked', () => {
        const { container } = render(<SettingsPanel />);
        const toggle = container.querySelector('#settingsToggle');
        expect(toggle).toBeTruthy();

        fireEvent.click(toggle);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);

        fireEvent.click(toggle);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(false);
    });

    it('closes panel when click happens outside', () => {
        const { container } = render(<SettingsPanel />);
        const toggle = container.querySelector('#settingsToggle');
        fireEvent.click(toggle);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);

        fireEvent.mouseDown(document.body);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(false);
    });

    it('closes panel on app-idle event', () => {
        const { container } = render(<SettingsPanel />);
        const toggle = container.querySelector('#settingsToggle');
        fireEvent.click(toggle);
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);

        act(() => {
            window.dispatchEvent(new Event('app-idle'));
        });
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(false);
    });

    it('opens panel on open-settings-dials event', () => {
        const { container } = render(<SettingsPanel />);
        act(() => {
            window.dispatchEvent(new Event('open-settings-dials'));
        });
        expect(container.querySelector('.settings-panel').classList.contains('open')).toBe(true);
    });

    it('updates username on display name input', () => {
        render(<SettingsPanel />);
        const input = screen.getByLabelText(/display name/i);
        fireEvent.change(input, { target: { value: 'New Name' } });
        expect(spState.setUsername).toHaveBeenCalledWith('New Name');
    });

    it('keeps a cleared city empty after closing and reopening settings', () => {
        spState.setFallbackCity.mockImplementation(city => { spState.fallbackCity = city; });
        render(<SettingsPanel />);
        const toggle = screen.getByRole('button', { name: 'Toggle Settings Panel' });
        fireEvent.click(toggle);
        expect(screen.getByLabelText(/your city/i).value).toBe('Lisbon');
        fireEvent.change(screen.getByLabelText(/your city/i), { target: { value: '' } });
        expect(spState.setFallbackCity).toHaveBeenCalledWith('');
        fireEvent.click(toggle);
        fireEvent.click(toggle);
        expect(screen.getByLabelText(/your city/i).value).toBe('');
    });

    it('does not save an unfinished city search', () => {
        render(<SettingsPanel />);
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Settings Panel' }));
        fireEvent.change(screen.getByLabelText(/your city/i), { target: { value: 'Lo' } });
        expect(screen.getByLabelText(/your city/i).value).toBe('Lo');
        expect(spState.setFallbackCity).not.toHaveBeenCalled();
    });

    it('updates malUsername on input', () => {
        render(<SettingsPanel />);
        const input = screen.getByLabelText(/myanimelist username/i);
        fireEvent.change(input, { target: { value: 'animelover' } });
        expect(spState.setMalUsername).toHaveBeenCalledWith('animelover');
    });

    it('adds a speed dial', () => {
        render(<SettingsPanel />);
        const input = screen.getByPlaceholderText('Paste URL here...');
        fireEvent.change(input, { target: { value: 'https://reddit.com' } });

        const addBtn = screen.getByRole('button', { name: 'Add speed dial' });
        fireEvent.click(addBtn);

        expect(spState.setSpeedDials).toHaveBeenCalled();
        const arg = spState.setSpeedDials.mock.calls[0][0];
        expect(arg.some(d => d.url === 'https://reddit.com/')).toBe(true);
    });

    it('removes a speed dial', () => {
        render(<SettingsPanel />);
        const deleteBtn = screen.getByRole('button', { name: 'Delete speed dial' });
        fireEvent.click(deleteBtn);

        expect(spState.setSpeedDials).toHaveBeenCalledWith([]);
    });

    it('opens reset modal and confirms cancellation', () => {
        render(<SettingsPanel />);
        const resetBtn = screen.getByRole('button', { name: /reset all settings/i });
        fireEvent.click(resetBtn);

        expect(screen.getByText('Are you sure you want to reset all settings?')).toBeTruthy();

        const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
        fireEvent.click(cancelBtn);

        expect(screen.queryByText('Are you sure you want to reset all settings?')).toBeNull();
    });

    it('closes settings with Escape and returns focus to the toggle', () => {
        render(<SettingsPanel />);
        const toggle = screen.getByRole('button', { name: 'Toggle Settings Panel' });
        toggle.focus(); fireEvent.click(toggle);
        expect(screen.getByRole('dialog', { name: 'Aura Settings' }).contains(document.activeElement)).toBe(true);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(toggle.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(toggle);
    });

    it('opens settings without focusing a text input or moving to the city field', () => {
        render(<SettingsPanel />);
        fireEvent.click(screen.getByRole('button', { name: 'Toggle Settings Panel' }));
        expect(document.activeElement).toBe(screen.getByRole('dialog', { name: 'Aura Settings' }));
        expect(document.activeElement).not.toBe(screen.getByLabelText(/your city/i));
        fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
        const panel = screen.getByRole('dialog', { name: 'Aura Settings' });
        expect(panel.contains(document.activeElement)).toBe(true);
        expect(document.activeElement).not.toBe(panel);
    });

    it('renders keyboard shortcuts section on desktop', () => {
        render(<SettingsPanel embedded={false} />);
        expect(screen.getByText('Keyboard Shortcuts')).toBeTruthy();
        expect(screen.getByText('Focus Search')).toBeTruthy();
        expect(screen.getByText('Search Prefixes')).toBeTruthy();
    });

    it('does not render keyboard shortcuts section when embedded in compact layout', () => {
        render(<SettingsPanel embedded={true} />);
        expect(screen.queryByText('Keyboard Shortcuts')).toBeNull();
        expect(screen.queryByText('Focus Search')).toBeNull();
        expect(screen.getByText('Search Prefixes')).toBeTruthy();
    });

    it('does not render keyboard shortcuts section on mobile/touch screens', () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query.includes('max-width') || query.includes('hover: none'),
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        try {
            render(<SettingsPanel embedded={false} />);
            expect(screen.queryByText('Keyboard Shortcuts')).toBeNull();
            expect(screen.queryByText('Focus Search')).toBeNull();
            expect(screen.getByText('Search Prefixes')).toBeTruthy();
        } finally {
            window.matchMedia = originalMatchMedia;
        }
    });
});

