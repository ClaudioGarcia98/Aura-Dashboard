import { useEffect } from 'react';

export function useDialog(ref, active, onClose) {
    useEffect(() => {
        if (!active || !ref.current) return;
        const previous = document.activeElement;
        const panel = ref.current;
        const focusable = () => [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]')]
            .filter(el => !el.closest('[hidden], [inert]') && el.getAttribute('type') !== 'file'
                && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
        (focusable()[0] || panel).focus();
        // A visibility transition can still hide the sheet during the commit frame.
        const focusFrame = window.requestAnimationFrame?.(() => {
            if (!panel.contains(document.activeElement)) (focusable()[0] || panel).focus();
        });
        const handleKey = event => {
            if (event.key === 'Escape') { event.preventDefault(); onClose(); }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            const first = elements[0] || panel;
            const last = elements.at(-1) || panel;
            if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            if (focusFrame !== undefined) window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKey);
            if (previous?.isConnected) previous.focus();
        };
    }, [ref, active, onClose]);
}
