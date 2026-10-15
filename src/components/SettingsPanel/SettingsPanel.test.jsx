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
        expect(arg.some(d => d.url === 'https://reddit.com')).toBe(true);
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
});
