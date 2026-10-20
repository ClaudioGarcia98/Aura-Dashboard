import { useEffect } from 'react';

function isVisible(element) {
    if (element.closest('[hidden], [inert]')) return false;
    if (getComputedStyle(element).visibility === 'hidden') return false;
    for (let current = element; current; current = current.parentElement) {
        if (getComputedStyle(current).display === 'none') return false;
    }
    return true;
}

export function getActiveModal() {
    return [...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].reverse().find(isVisible) || null;
}

export function useDialog(ref, active, onClose, focusPanel = false) {
    useEffect(() => {
        if (!active || !ref.current) return;
        const previous = document.activeElement;
        const panel = ref.current;
        const focusable = () => [...panel.querySelectorAll('button, input, select, textarea, a[href], [tabindex], [contenteditable="true"]')]
            .filter(el => !el.matches(':disabled') && el.tabIndex >= 0 && el.getAttribute('type') !== 'file' && isVisible(el));
        const focusInitial = () => (focusPanel ? panel : focusable()[0] || panel).focus({ preventScroll: true });
        focusInitial();
        // A visibility transition can still hide the sheet during the commit frame.
        const focusFrame = window.requestAnimationFrame?.(() => {
            if (!panel.contains(document.activeElement)) focusInitial();
        });
        const handleKey = event => {
            if (getActiveModal() !== panel) return;
            if (event.key === 'Escape') { event.preventDefault(); onClose(); }
            if (event.key !== 'Tab') return;
            const elements = focusable();
            const first = elements[0] || panel;
            const last = elements.at(-1) || panel;
            if (event.shiftKey && (document.activeElement === panel || document.activeElement === first || !panel.contains(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        };
        const containFocus = event => {
            if (getActiveModal() === panel && !panel.contains(event.target)) focusInitial();
        };
        document.addEventListener('keydown', handleKey);
        document.addEventListener('focusin', containFocus);
        return () => {
            if (focusFrame !== undefined) window.cancelAnimationFrame(focusFrame);
            document.removeEventListener('keydown', handleKey);
            document.removeEventListener('focusin', containFocus);
            if (previous?.isConnected) previous.focus();
        };
    }, [ref, active, onClose, focusPanel]);
}
