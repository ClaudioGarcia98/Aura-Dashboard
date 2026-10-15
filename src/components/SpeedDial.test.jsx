import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SpeedDial from './SpeedDial';

let mockState;

vi.mock('../stores/useSettingsStore', () => ({
    useSettingsStore: (selector) => {
        return typeof selector === 'function' ? selector(mockState) : mockState;
    },
}));

describe('SpeedDial', () => {
    beforeEach(() => {
        mockState = {
            speedDials: [
                { id: 1, name: 'Google', url: 'https://google.com' },
                { id: 2, name: 'GitHub', url: 'https://github.com' },
            ],
            setSpeedDials: vi.fn(),
        };
    });

    it('renders configured speed dials and add button', () => {
        render(<SpeedDial />);
        expect(screen.getByLabelText('Google')).toBeTruthy();
        expect(screen.getByLabelText('GitHub')).toBeTruthy();
        expect(screen.getByTitle('Add Speed Dial')).toBeTruthy();
    });

    it('renders empty add button when speed dials array is empty', () => {
        mockState.speedDials = [];
        render(<SpeedDial />);
        expect(screen.getByRole('button', { name: /add speed dial/i })).toBeTruthy();
    });

    it('gracefully handles non-array speedDials without crashing', () => {
        mockState.speedDials = null;
        render(<SpeedDial />);
        expect(screen.getByRole('button', { name: /add speed dial/i })).toBeTruthy();
    });

    it('calls setSpeedDials filtering out deleted item when remove button is clicked', () => {
        const { container } = render(<SpeedDial />);
        const deleteBtns = container.querySelectorAll('.speed-dial-delete');
        expect(deleteBtns.length).toBe(2);

        fireEvent.click(deleteBtns[0]);

        expect(mockState.setSpeedDials).toHaveBeenCalledWith([
            { id: 2, name: 'GitHub', url: 'https://github.com' }
        ]);
    });

    it('dispatches open-settings-dials event when add button is clicked', () => {
        const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
        render(<SpeedDial />);

        const addBtn = screen.getByRole('button', { name: 'Add Speed Dial' });
        fireEvent.click(addBtn);

        expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'open-settings-dials' }));
    });

    it('shows fallback initial when image fails to load', () => {
        const { container } = render(<SpeedDial />);
        const images = container.querySelectorAll('.speed-dial-item img');
        expect(images.length).toBe(2);

        // Trigger error event on first image
        fireEvent.error(images[0]);

        const fallbacks = container.querySelectorAll('.speed-dial-fallback');
        expect(fallbacks[0].textContent).toBe('G');
    });

    it('handles pointer-based reordering', () => {
        const { container } = render(<SpeedDial />);
        const wrappers = container.querySelectorAll('.speed-dial-wrapper');
        expect(wrappers.length).toBe(2);

        const originalElementFromPoint = document.elementFromPoint;
        document.elementFromPoint = vi.fn().mockReturnValue(wrappers[1]);

        try {
            fireEvent.pointerDown(wrappers[0], {
                button: 0,
                isPrimary: true,
                clientX: 10,
                clientY: 10,
            });

            fireEvent.pointerMove(window, {
                clientX: 30,
                clientY: 30,
            });

            expect(mockState.setSpeedDials).toHaveBeenCalled();

            fireEvent.pointerUp(window);
        } finally {
            document.elementFromPoint = originalElementFromPoint;
        }
    });
});
