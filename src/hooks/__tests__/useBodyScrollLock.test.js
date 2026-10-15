import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBodyScrollLock } from '../useBodyScrollLock';

describe('useBodyScrollLock', () => {
    beforeEach(() => {
        document.body.className = '';
    });

    it('adds drawer-open class to body when active is true', () => {
        const { rerender } = renderHook(({ active }) => useBodyScrollLock(active), {
            initialProps: { active: false },
        });

        expect(document.body.classList.contains('drawer-open')).toBe(false);

        rerender({ active: true });
        expect(document.body.classList.contains('drawer-open')).toBe(true);

        rerender({ active: false });
        expect(document.body.classList.contains('drawer-open')).toBe(false);
    });

    it('removes drawer-open class upon unmount', () => {
        const { unmount } = renderHook(() => useBodyScrollLock(true));
        expect(document.body.classList.contains('drawer-open')).toBe(true);

        unmount();
        expect(document.body.classList.contains('drawer-open')).toBe(false);
    });
});
