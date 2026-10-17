import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ThemeSettings from './ThemeSettings';
import { THEMES, FONTS, themeLabel } from '../../constants/settingsConstants';

let mockState;

vi.mock('../../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        return typeof selector === 'function' ? selector(mockState) : mockState;
    },
}));

beforeEach(() => {
    mockState = {
        theme: 'nord',
        setTheme: vi.fn(),
        font: 'raleway',
        setFont: vi.fn(),
        clockMode: 'digital',
        setClockMode: vi.fn(),
        use24hClock: false,
        setUse24hClock: vi.fn(),
    };
});

describe('ThemeSettings', () => {
    it('renders all theme buttons with active class on selected theme', () => {
        render(<ThemeSettings />);

        Object.keys(THEMES).forEach((t) => {
            const btn = screen.getByRole('button', { name: themeLabel(t), exact: true });
            expect(btn).toBeTruthy();
            if (t === 'nord') {
                expect(btn.classList.contains('active')).toBe(true);
            }
        });
    });

    it('calls setTheme when a theme button is clicked', () => {
        render(<ThemeSettings />);

        const tokyoBtn = screen.getByRole('button', { name: 'Tokyo', exact: true });
        fireEvent.click(tokyoBtn);

        expect(mockState.setTheme).toHaveBeenCalledWith('tokyo');
    });

    it('renders all font buttons and marks active font', () => {
        render(<ThemeSettings />);

        Object.keys(FONTS).forEach((f) => {
            const label = f.charAt(0).toUpperCase() + f.slice(1);
            const btn = screen.getByRole('button', { name: new RegExp(label, 'i') });
            expect(btn).toBeTruthy();
            if (f === 'raleway') {
                expect(btn.classList.contains('active')).toBe(true);
            }
        });
    });

    it('calls setFont when a font button is clicked', () => {
        render(<ThemeSettings />);

        const outfitBtn = screen.getByRole('button', { name: /outfit/i });
        fireEvent.click(outfitBtn);

        expect(mockState.setFont).toHaveBeenCalledWith('outfit');
    });

    it('renders clock styles and calls setClockMode on click', () => {
        render(<ThemeSettings />);

        const analogBtn = screen.getByRole('button', { name: 'Analog' });
        expect(analogBtn).toBeTruthy();

        fireEvent.click(analogBtn);
        expect(mockState.setClockMode).toHaveBeenCalledWith('analog');
    });

    it('renders clock format options and calls setUse24hClock', () => {
        render(<ThemeSettings />);

        const btn12 = screen.getByRole('button', { name: '12-Hour' });
        const btn24 = screen.getByRole('button', { name: '24-Hour' });

        expect(btn12.classList.contains('active')).toBe(true);
        expect(btn24.classList.contains('active')).toBe(false);

        fireEvent.click(btn24);
        expect(mockState.setUse24hClock).toHaveBeenCalledWith(true);

        fireEvent.click(btn12);
        expect(mockState.setUse24hClock).toHaveBeenCalledWith(false);
    });
});
