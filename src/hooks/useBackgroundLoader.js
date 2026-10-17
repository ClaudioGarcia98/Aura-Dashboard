import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getBackgroundBlob } from '../services/db';
import { DEFAULT_BACKGROUND } from '../constants/background';

export function useBackgroundLoader() {
    const setBackgroundUrl = useSettingsStore(s => s.setBackgroundUrl);
    const setBackgroundIsVideo = useSettingsStore(s => s.setBackgroundIsVideo);

    const backgroundUrl = useSettingsStore(s => s.backgroundUrl);
    useEffect(() => () => {
        if (backgroundUrl?.startsWith('blob:')) URL.revokeObjectURL(backgroundUrl);
    }, [backgroundUrl]);

    useEffect(() => {
        let active = true;
        let blobUrl = null;

        getBackgroundBlob().then(blob => {
            if (!active || useSettingsStore.getState?.().backgroundUrl) return;
            if (blob) {
                blobUrl = URL.createObjectURL(blob);
                setBackgroundUrl(blobUrl);
                setBackgroundIsVideo(blob.type ? blob.type.startsWith('video/') : false);
            } else {
                setBackgroundUrl(DEFAULT_BACKGROUND.url);
                setBackgroundIsVideo(true);
            }
        }).catch(() => {
            if (!active) return;
            setBackgroundUrl(DEFAULT_BACKGROUND.url);
            setBackgroundIsVideo(true);
        });

        return () => {
            active = false;
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [setBackgroundUrl, setBackgroundIsVideo]);
}
