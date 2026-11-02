import { useEffect } from 'react';
import { syncSettingsFromStorage } from '../stores/useSettingsStore';
import { safeStorage } from '../utils/storage';

export function useSettingsSync() {
    useEffect(() => {
        let previous = safeStorage.getItem('dash_settings');
        const sync = () => {
            const next = safeStorage.getItem('dash_settings');
            if (next === previous) return;
            previous = next;
            syncSettingsFromStorage(next);
        };
        const onStorage = event => {
            if ((event.key === 'dash_settings' || event.key === null)
                && (!event.storageArea || event.storageArea === localStorage)) sync();
        };
        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', sync);
        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', sync);
        };
    }, []);
}
