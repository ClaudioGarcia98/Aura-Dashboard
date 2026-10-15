import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { getBackgroundBlob } from '../services/db';
import defaultVideo from '../assets/animated_gif.mp4';

export function useBackgroundLoader() {
    const setBackgroundUrl = useSettingsStore(s => s.setBackgroundUrl);
    const setBackgroundIsVideo = useSettingsStore(s => s.setBackgroundIsVideo);

    useEffect(() => {
        let blobUrl = null;

        getBackgroundBlob().then(blob => {
            if (blob) {
                blobUrl = URL.createObjectURL(blob);
                setBackgroundUrl(blobUrl);
                setBackgroundIsVideo(blob.type ? blob.type.startsWith('video/') : false);
            } else {
                setBackgroundUrl(defaultVideo);
                setBackgroundIsVideo(true);
            }
        }).catch(() => {
            setBackgroundUrl(defaultVideo);
            setBackgroundIsVideo(true);
        });

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [setBackgroundUrl, setBackgroundIsVideo]);
}
