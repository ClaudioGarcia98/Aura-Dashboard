import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePointerReorder } from '../usePointerReorder';

describe('usePointerReorder', () => {
    let originalElementFromPoint;

    beforeEach(() => {
        originalElementFromPoint = document.elementFromPoint;
    });

    afterEach(() => {
        document.elementFromPoint = originalElementFromPoint;
        vi.clearAllMocks();
    });

    it('initializes with draggingId null and pointer at 0, 0', () => {
        const onReorder = vi.fn();
        const { result } = renderHook(() => usePointerReorder({ onReorder }));

        expect(result.current.draggingId).toBeNull();
        expect(result.current.pointer).toEqual({ x: 0, y: 0 });
    });

    it('detaches an unfinished drag on unmount', () => {
        const onReorder = vi.fn();
        const target = document.createElement('div'); target.dataset.reorderId = 'other';
        document.elementFromPoint = vi.fn(() => target);
        const { result, unmount } = renderHook(() => usePointerReorder({ onReorder }));
        act(() => result.current.startDrag({ clientX: 0, clientY: 0, isPrimary: true }, 'first'));
        unmount();
        window.dispatchEvent(new PointerEvent('pointermove', { clientX: 30, clientY: 30 }));
        expect(onReorder).not.toHaveBeenCalled();
    });

    it('ignores secondary pointers or non-primary mouse buttons', () => {
        const onReorder = vi.fn();
        const { result } = renderHook(() => usePointerReorder({ onReorder }));

        act(() => {
            result.current.startDrag({ isPrimary: false, clientX: 10, clientY: 10 }, 'item-1');
        });
        expect(result.current.pointer).toEqual({ x: 0, y: 0 });

        act(() => {
            result.current.startDrag({ pointerType: 'mouse', button: 2, clientX: 10, clientY: 10 }, 'item-1');
        });
        expect(result.current.pointer).toEqual({ x: 0, y: 0 });
    });

    it('does not trigger drag if movement is below threshold', () => {
        const onReorder = vi.fn();
        const { result } = renderHook(() => usePointerReorder({ onReorder, threshold: 10 }));

        act(() => {
            result.current.startDrag({ clientX: 100, clientY: 100, isPrimary: true }, 'item-1');
        });

        act(() => {
            window.dispatchEvent(new PointerEvent('pointermove', { clientX: 104, clientY: 104 }));
        });

        expect(result.current.draggingId).toBeNull();
        expect(onReorder).not.toHaveBeenCalled();
    });

    it('starts drag and invokes onReorder when moved over another item', () => {
        const onReorder = vi.fn();
        const { result } = renderHook(() => usePointerReorder({ onReorder, threshold: 5 }));

        // Mock elementFromPoint to return an element inside an item with data-reorder-id="item-2"
        const targetEl = document.createElement('div');
        targetEl.setAttribute('data-reorder-id', 'item-2');
        document.body.appendChild(targetEl);
        document.elementFromPoint = vi.fn(() => targetEl);

        act(() => {
            result.current.startDrag({ clientX: 50, clientY: 50, isPrimary: true }, 'item-1');
        });

        act(() => {
            window.dispatchEvent(new PointerEvent('pointermove', { clientX: 70, clientY: 70, cancelable: true }));
        });

        expect(result.current.draggingId).toBe('item-1');
        expect(result.current.pointer).toEqual({ x: 70, y: 70 });
        expect(onReorder).toHaveBeenCalledWith('item-1', 'item-2');

        // Cleanup on pointerup
        act(() => {
            window.dispatchEvent(new PointerEvent('pointerup'));
        });

        expect(result.current.draggingId).toBeNull();
        document.body.removeChild(targetEl);
    });
});
