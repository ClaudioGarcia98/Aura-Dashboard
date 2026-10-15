import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpeedDial from './SpeedDial';

let mockState = {
    speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
    setSpeedDials: vi.fn(),
};

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        return typeof selector === 'function' ? selector(mockState) : mockState;
    },
}));

describe('SpeedDial', () => {
    it('renders configured speed dials and add button', () => {
        mockState.speedDials = [{ id: 1, name: 'Google', url: 'https://google.com' }];
        render(<SpeedDial />);
        expect(screen.getByLabelText('Google')).toBeTruthy();
        expect(screen.getByTitle('Add Speed Dial')).toBeTruthy();
    });

    it('renders empty add button when speed dials array is empty', () => {
        mockState.speedDials = [];
        render(<SpeedDial />);
        expect(screen.getByRole('button', { name: /add speed dial/i })).toBeTruthy();
    });

    it('gracefully handles non-array speedDials without crashing', () => {
        mockState.speedDials = () => {};
        render(<SpeedDial />);
        expect(screen.getByRole('button', { name: /add speed dial/i })).toBeTruthy();
    });

    it('calls setSpeedDials when remove button is clicked', () => {
        const setSpeedDials = vi.fn();
        mockState = {
            speedDials: [{ id: 1, name: 'Google', url: 'https://google.com' }],
            setSpeedDials,
        };
        const { container } = render(<SpeedDial />);
        const deleteBtn = container.querySelector('.speed-dial-delete');
        expect(deleteBtn).toBeTruthy();
        deleteBtn.click();
        expect(setSpeedDials).toHaveBeenCalled();
    });
});

