import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Greeting from './Greeting';

let mockUsername = 'Claudio';

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        const state = { username: mockUsername };
        return typeof selector === 'function' ? selector(state) : state;
    },
}));

describe('Greeting Component', () => {
    beforeEach(() => {
        localStorage.clear();
        mockUsername = 'Claudio';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the username in morning hours', () => {
        vi.setSystemTime(new Date(2025, 0, 1, 9, 0, 0)); // 9:00 AM
        render(<Greeting />);
        expect(screen.getByText(/Good morning, Claudio/i)).toBeTruthy();
    });

    it('renders afternoon greeting between 12:00 and 18:00', () => {
        vi.setSystemTime(new Date(2025, 0, 1, 14, 0, 0)); // 2:00 PM
        render(<Greeting />);
        expect(screen.getByText(/Good afternoon, Claudio/i)).toBeTruthy();
    });

    it('renders evening greeting between 18:00 and 22:00', () => {
        vi.setSystemTime(new Date(2025, 0, 1, 19, 0, 0)); // 7:00 PM
        render(<Greeting />);
        expect(screen.getByText(/Good evening, Claudio/i)).toBeTruthy();
    });

    it('renders time to rest at night', () => {
        vi.setSystemTime(new Date(2025, 0, 1, 23, 0, 0)); // 11:00 PM
        render(<Greeting />);
        expect(screen.getByText(/Time to rest, Claudio/i)).toBeTruthy();
    });

    it('reacts to weather-update event and applies weather modifier', () => {
        vi.setSystemTime(new Date(2025, 0, 1, 10, 0, 0)); // 10:00 AM
        render(<Greeting />);
        expect(screen.getByText(/Good morning, Claudio/i)).toBeTruthy();

        // Dispatch clear sky (code 0)
        act(() => {
            window.dispatchEvent(new CustomEvent('weather-update', { detail: 0 }));
        });

        expect(screen.getByText(/Clear skies this morning, Claudio/i)).toBeTruthy();

        // Dispatch rainy (code 61)
        act(() => {
            window.dispatchEvent(new CustomEvent('weather-update', { detail: 61 }));
        });

        expect(screen.getByText(/Cozy rainy morning, Claudio/i)).toBeTruthy();
    });

    it('renders greeting without a trailing comma when username is empty', () => {
        mockUsername = '';
        vi.setSystemTime(new Date(2025, 0, 1, 9, 0, 0)); // 9:00 AM
        render(<Greeting />);
        expect(screen.getByText('Good morning')).toBeTruthy();
        expect(screen.queryByText(/Good morning,/i)).toBeNull();
    });
});
