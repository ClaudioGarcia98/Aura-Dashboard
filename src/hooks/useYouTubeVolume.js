import { useCallback, useEffect, useRef } from 'react';
import { applyYouTubeVolume, isYouTubeReadyMessage, listenYouTubePlayer, readYouTubeMessage } from '../services/youtube';

// All trailers start muted in their URL. A verified player-ready message applies
// the latest preferences, including changes made while the iframe was loading.
export function useYouTubeVolume(iframeRef, videoId, volume, muted = false) {
    const preferences = useRef({ volume, muted });
    const ready = useRef(false);
    const interval = useRef();
    const timeout = useRef();
    const stopListening = useCallback(() => {
        clearInterval(interval.current);
        clearTimeout(timeout.current);
    }, []);
    const onLoad = useCallback(() => {
        stopListening();
        ready.current = false;
        const listen = () => listenYouTubePlayer(iframeRef.current);
        listen();
        interval.current = setInterval(listen, 250);
        timeout.current = setTimeout(stopListening, 10000);
    }, [iframeRef, stopListening]);

    useEffect(() => {
        preferences.current = { volume, muted };
        if (ready.current) applyYouTubeVolume(iframeRef.current, volume, muted);
    }, [volume, muted, iframeRef]);

    useEffect(() => {
        ready.current = false;
        const handleMessage = event => {
            const data = readYouTubeMessage(event, iframeRef.current);
            if (ready.current || !isYouTubeReadyMessage(data)) return;
            ready.current = true;
            stopListening();
            applyYouTubeVolume(iframeRef.current, preferences.current.volume, preferences.current.muted);
        };
        window.addEventListener('message', handleMessage);
        return () => {
            ready.current = false;
            stopListening();
            window.removeEventListener('message', handleMessage);
        };
    }, [iframeRef, videoId, stopListening]);

    return onLoad;
}
