import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribe to a CSS media query and re-render when it changes.
 * @param {string} query e.g. '(max-width: 1024px)'
 * @returns {boolean} whether the query currently matches
 */
export function useMediaQuery(query) {
    const subscribe = useCallback((callback) => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return () => {};
        }
        const mql = window.matchMedia(query);
        mql.addEventListener('change', callback);
        return () => mql.removeEventListener('change', callback);
    }, [query]);

    const getSnapshot = useCallback(() => {
        return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia(query).matches
            : false;
    }, [query]);

    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
