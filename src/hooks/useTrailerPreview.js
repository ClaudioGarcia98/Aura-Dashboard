import { useCallback, useEffect, useRef, useState } from 'react';
import { extractTrailerId } from '../services/animeService';
import { safeStorage } from '../utils/storage';
import { COMPACT_MEDIA_QUERY } from '../constants/responsive';

export function useTrailerPreview() {
    const [previewTrailer, setPreviewTrailer] = useState(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [trailerMuted, setTrailerMuted] = useState(() => safeStorage.getItem('dash_trailer_muted') !== 'false');
    const hoverTimer = useRef();
    const hideTimer = useRef();
    const close = useCallback(() => {
        clearTimeout(hoverTimer.current);
        clearTimeout(hideTimer.current);
        setPreviewTrailer(null);
    }, []);
    useEffect(() => {
        const escape = event => { if (event.key === 'Escape') close(); };
        document.addEventListener('keydown', escape);
        window.addEventListener('app-idle', close);
        return () => {
            clearTimeout(hoverTimer.current);
            clearTimeout(hideTimer.current);
            document.removeEventListener('keydown', escape);
            window.removeEventListener('app-idle', close);
        };
    }, [close]);
    const handleMouseEnter = useCallback((event, anime) => {
        if (window.matchMedia?.(COMPACT_MEDIA_QUERY).matches) return;
        clearTimeout(hoverTimer.current);
        clearTimeout(hideTimer.current);
        const videoId = extractTrailerId(anime);
        if (!videoId) { setPreviewTrailer(null); return; }
        const rect = event.currentTarget.getBoundingClientRect();
        const sidebar = event.currentTarget.closest('.anime-sidebar') !== null;
        let x = sidebar ? rect.left - 320 : rect.right + 20;
        if (sidebar && x < 10) x = rect.right + 10;
        if (!sidebar && x + 300 > window.innerWidth - 10) x = rect.left - 320;
        const y = Math.max(10, Math.min(rect.top + rect.height / 2 - 84.5, window.innerHeight - 179));
        hoverTimer.current = setTimeout(() => {
            if (window.matchMedia?.(COMPACT_MEDIA_QUERY).matches) return;
            setPreviewTrailer(videoId);
            setPreviewPos({ x: Math.max(10, x), y });
        }, 400);
    }, []);
    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimer.current);
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);
    const handleTrailerMouseEnter = useCallback(() => clearTimeout(hideTimer.current), []);
    const handleTrailerMouseLeave = useCallback(() => {
        clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);
    const handleUnmute = useCallback(() => {
        setTrailerMuted(false);
        safeStorage.setItem('dash_trailer_muted', 'false');
    }, []);
    const handleMute = useCallback(() => {
        setTrailerMuted(true);
        safeStorage.setItem('dash_trailer_muted', 'true');
    }, []);
    return { previewTrailer, previewPos, trailerMuted, handleMouseEnter, handleMouseLeave, handleTrailerMouseEnter, handleTrailerMouseLeave, handleUnmute, handleMute };
}
