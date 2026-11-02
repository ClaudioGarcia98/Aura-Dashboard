import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getBackgroundBlob } from '../services/db';
import { DEFAULT_BACKGROUND } from '../constants/background';
import { BACKGROUND_RECOVERY_MESSAGE, recoverBackground, validateBackgroundMedia } from '../services/backgroundMedia';
import { BACKGROUND_REVISION_KEY } from '../services/backgroundSync';
import { safeStorage } from '../utils/storage';

export function useBackgroundLoader() {
    const [backgroundError, setBackgroundError] = useState('');
    const backgroundUrl = useSettingsStore(s => s.backgroundUrl);
    useEffect(() => () => {
        // The store owns the active URL; a StrictMode remount must not revoke it.
        if (backgroundUrl?.startsWith('blob:') && useSettingsStore.getState().backgroundUrl !== backgroundUrl) URL.revokeObjectURL(backgroundUrl);
    }, [backgroundUrl]);

    const handleBackgroundError = useCallback(failedUrl => {
        if (recoverBackground(failedUrl)) setBackgroundError(failedUrl === DEFAULT_BACKGROUND.url
            ? 'Background unavailable. Choose another image or video in Settings.' : BACKGROUND_RECOVERY_MESSAGE);
    }, []);

    useEffect(() => {
        let controller;
        let revision = safeStorage.getItem(BACKGROUND_REVISION_KEY);
        const load = async (replace = false) => {
            controller?.abort();
            controller = new AbortController();
            const { signal } = controller;
            const previousUrl = useSettingsStore.getState().backgroundUrl;
            if (previousUrl && !replace) return;
            const obsolete = () => signal.aborted || useSettingsStore.getState().backgroundUrl !== previousUrl;
            try {
                const blob = await getBackgroundBlob();
                if (obsolete()) return;
                if (blob) await validateBackgroundMedia(blob, { signal });
                if (obsolete()) return;
                useSettingsStore.setState({ backgroundUrl: blob ? URL.createObjectURL(blob) : DEFAULT_BACKGROUND.url,
                    backgroundIsVideo: !blob || blob.type.startsWith('video/') });
            } catch (error) {
                if (!obsolete() && error.name !== 'AbortError') handleBackgroundError(previousUrl);
            }
        };
        const sync = () => {
            const next = safeStorage.getItem(BACKGROUND_REVISION_KEY);
            if (next === revision) return;
            revision = next;
            void load(true);
        };
        const onStorage = event => {
            if ((event.key === BACKGROUND_REVISION_KEY || event.key === null || (event.key === 'dash_settings' && event.newValue === null))
                && (!event.storageArea || event.storageArea === localStorage)) {
                // A full reset also removes the revision; even an older tab
                // without a revision must release its custom wallpaper.
                if (event.key === null || event.key === 'dash_settings') void load(true);
                else sync();
            }
        };
        void load();
        window.addEventListener('storage', onStorage);
        window.addEventListener('focus', sync);
        return () => {
            controller?.abort();
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('focus', sync);
        };
    }, [handleBackgroundError]);

    useEffect(() => {
        if (backgroundUrl && backgroundUrl !== DEFAULT_BACKGROUND.url) queueMicrotask(() => setBackgroundError(''));
    }, [backgroundUrl]);

    return { backgroundError, handleBackgroundError };
}
