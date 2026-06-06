import { useEffect } from 'react';

/**
 * Toggles a `drawer-open` class on <body> while `active` is true.
 * CSS gates the actual scroll lock to phone widths
 * (`@media (max-width: 768px) { body.drawer-open { overflow: hidden } }`),
 * so desktop/tablet behavior is unaffected.
 */
export function useBodyScrollLock(active) {
    useEffect(() => {
        document.body.classList.toggle('drawer-open', !!active);
        return () => document.body.classList.remove('drawer-open');
    }, [active]);
}
