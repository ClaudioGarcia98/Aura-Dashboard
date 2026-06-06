import { useState, useRef, useCallback } from 'react';

/**
 * Pointer-based drag-to-reorder that works for mouse, touch and pen.
 *
 * Replaces HTML5 drag-and-drop (which never fires on touchscreens).
 *
 * Usage:
 *   const { draggingId, pointer, startDrag } = usePointerReorder({ onReorder });
 *   // on each item:  data-reorder-id={id}
 *   // on the drag handle (or whole item):  onPointerDown={(e) => startDrag(e, id)}
 *
 * @param {Object}   opts
 * @param {(fromId: string, toId: string) => void} opts.onReorder
 *        Move the dragged item (fromId) to the position of the item under the pointer (toId).
 * @param {number}   [opts.threshold=6]  px the pointer must travel before a drag begins
 *        (so taps / clicks still work).
 * @returns {{ draggingId: string|null, pointer: {x:number,y:number}, startDrag: Function }}
 */
export function usePointerReorder({ onReorder, threshold = 6 }) {
    const [draggingId, setDraggingId] = useState(null);
    const [pointer, setPointer] = useState({ x: 0, y: 0 });
    const stateRef = useRef(null);

    const idAtPoint = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const item = el && el.closest('[data-reorder-id]');
        return item ? item.getAttribute('data-reorder-id') : null;
    };

    const startDrag = useCallback((e, id) => {
        // primary pointer only (ignore extra touches / non-left mouse buttons)
        if (e.isPrimary === false) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        const st = { id: String(id), startX: e.clientX, startY: e.clientY, started: false };
        stateRef.current = st;
        setPointer({ x: e.clientX, y: e.clientY });

        const handleMove = (ev) => {
            const s = stateRef.current;
            if (!s) return;
            setPointer({ x: ev.clientX, y: ev.clientY });

            if (!s.started) {
                if (Math.hypot(ev.clientX - s.startX, ev.clientY - s.startY) < threshold) return;
                s.started = true;
                setDraggingId(s.id);
            }
            ev.preventDefault();

            const overId = idAtPoint(ev.clientX, ev.clientY);
            if (overId && overId !== s.id) {
                onReorder(s.id, overId);
            }
        };

        const cleanup = () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
            window.removeEventListener('pointercancel', handleUp);
        };

        const handleUp = () => {
            const didDrag = stateRef.current?.started;
            stateRef.current = null;
            setDraggingId(null);
            cleanup();
            // Swallow the click that fires right after a drag so links don't navigate.
            if (didDrag) {
                const swallow = (ce) => {
                    ce.preventDefault();
                    ce.stopPropagation();
                    window.removeEventListener('click', swallow, true);
                };
                window.addEventListener('click', swallow, true);
                setTimeout(() => window.removeEventListener('click', swallow, true), 60);
            }
        };

        window.addEventListener('pointermove', handleMove, { passive: false });
        window.addEventListener('pointerup', handleUp);
        window.addEventListener('pointercancel', handleUp);
    }, [onReorder, threshold]);

    return { draggingId, pointer, startDrag };
}
