import { useCallback, useEffect, useState } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getBackgroundBlob } from '../services/db';
import { DEFAULT_BACKGROUND } from '../constants/background';
import { BACKGROUND_RECOVERY_MESSAGE, recoverBackground, validateBackgroundMedia } from '../services/backgroundMedia';

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
        const controller = new AbortController();
        const load = async () => {
            try {
                const blob = await getBackgroundBlob();
                if (controller.signal.aborted || useSettingsStore.getState().backgroundUrl) return;
                if (blob) await validateBackgroundMedia(blob, { signal: controller.signal });
                if (controller.signal.aborted || useSettingsStore.getState().backgroundUrl) return;
                useSettingsStore.setState({ backgroundUrl: blob ? URL.createObjectURL(blob) : DEFAULT_BACKGROUND.url,
                    backgroundIsVideo: !blob || blob.type.startsWith('video/') });
            } catch (error) {
                if (!controller.signal.aborted && error.name !== 'AbortError' && !useSettingsStore.getState().backgroundUrl) handleBackgroundError(null);
            }
        };
        void load();
        return () => controller.abort();
    }, [handleBackgroundError]);

    useEffect(() => {
        if (backgroundUrl && backgroundUrl !== DEFAULT_BACKGROUND.url) queueMicrotask(() => setBackgroundError(''));
    }, [backgroundUrl]);

    return { backgroundError, handleBackgroundError };
}
