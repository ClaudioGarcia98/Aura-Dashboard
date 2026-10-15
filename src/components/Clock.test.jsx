import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Clock from './Clock';

let mockSettings = { clockMode: 'digital', use24hClock: false };

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: vi.fn((selector) => {
        return typeof selector === 'function' ? selector(mockSettings) : mockSettings;
    }),
}));

describe('Clock Component', () => {
    beforeEach(() => {
        mockSettings = { clockMode: 'digital', use24hClock: false };
    });

    it('renders digital clock with AM/PM in 12-hour format', () => {
        mockSettings = { clockMode: 'digital', use24hClock: false };
        const { container } = render(<Clock />);

        expect(container.querySelector('.clock-row')).toBeTruthy();
        expect(container.querySelector('#time')).toBeTruthy();
        const ampm = container.querySelector('#ampm');
        expect(ampm).toBeTruthy();
        expect(['AM', 'PM']).toContain(ampm.textContent);
    });

    it('renders digital clock without AM/PM in 24-hour format', () => {
        mockSettings = { clockMode: 'digital', use24hClock: true };
        const { container } = render(<Clock />);

        const ampm = container.querySelector('#ampm');
        expect(ampm).toBeNull();
    });

    it('renders formatted current date', () => {
        const { container } = render(<Clock />);
        const dateEl = container.querySelector('#date');
        expect(dateEl).toBeTruthy();
        expect(dateEl.textContent.length).toBeGreaterThan(0);
    });

    it('renders analog clock canvas in analog mode', () => {
        mockSettings = { clockMode: 'analog', use24hClock: false };
        const { container } = render(<Clock />);

        expect(container.querySelector('#analogCanvas')).toBeTruthy();
        expect(container.querySelector('#clockRow').classList.contains('mode-analog')).toBe(true);
    });

    it('renders both digital and analog in both mode', () => {
        mockSettings = { clockMode: 'both', use24hClock: false };
        const { container } = render(<Clock />);

        expect(container.querySelector('#analogCanvas')).toBeTruthy();
        expect(container.querySelector('#time')).toBeTruthy();
        expect(container.querySelector('#clockRow').classList.contains('mode-both')).toBe(true);
    });
});
