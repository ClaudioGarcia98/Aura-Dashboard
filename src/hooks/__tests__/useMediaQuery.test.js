import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

describe('useMediaQuery', () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        vi.restoreAllMocks();
    });

    it('returns false when window.matchMedia is undefined', () => {
        delete window.matchMedia;
        const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
        expect(result.current).toBe(false);
    });

    it('returns true when media query matches initially', () => {
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: true,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }));

        const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
        expect(result.current).toBe(true);
    });

    it('updates when the media query change event fires', () => {
        let changeListener = null;
        let isMatching = false;

        window.matchMedia = vi.fn().mockImplementation((query) => ({
            get matches() {
                return isMatching;
            },
            media: query,
            addEventListener: vi.fn((event, handler) => {
                if (event === 'change') changeListener = handler;
            }),
            removeEventListener: vi.fn((event) => {
                if (event === 'change') changeListener = null;
            }),
        }));

        const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
        expect(result.current).toBe(false);

        act(() => {
            isMatching = true;
            if (changeListener) changeListener({ matches: true });
        });

        expect(result.current).toBe(true);
    });
});
