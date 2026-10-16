import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useShallow } from 'zustand/react/shallow';
import { fetchDaySchedule, extractTrailerId } from '../services/animeService';
import { useWatchingList } from './useWatchingList';
import { safeStorage } from '../utils/storage';

const DAY_FILTERS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
export const getPortugalDayFilter = () => {
    try {
        const ptDay = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Lisbon', weekday: 'long' }).format(new Date()).toLowerCase();
        return DAY_FILTERS.includes(ptDay) ? ptDay : DAY_FILTERS[(new Date().getDay() + 6) % 7];
    } catch {
        return DAY_FILTERS[(new Date().getDay() + 6) % 7];
    }
};

export function useAnimeSchedule({ alwaysOpen = false, enabled = true } = {}) {
    const { volume, malUsername, setMalError, setMalLoading, setMalSuccess, setMalStatus, setMalSavedAt } = useSettingsStore(useShallow(s => ({ volume: s.volume, malUsername: s.malUsername, setMalError: s.setMalError, setMalLoading: s.setMalLoading, setMalSuccess: s.setMalSuccess, setMalStatus: s.setMalStatus, setMalSavedAt: s.setMalSavedAt })));

    const [todayDay, setTodayDay] = useState(getPortugalDayFilter);
    const [isSidebarOpen, setIsSidebarOpen] = useState(alwaysOpen);
    const [expandedAnime, setExpandedAnime] = useState(null);
    const [activeDay, setActiveDay] = useState(todayDay);

    const [todayData, setTodayData] = useState([]);
    const [todayLoading, setTodayLoading] = useState(true);
    const [todayError, setTodayError] = useState(false);
    const [todayStale, setTodayStale] = useState(false);

    const [sidebarData, setSidebarData] = useState([]);
    const [sidebarLoading, setSidebarLoading] = useState(false);
    const [sidebarError, setSidebarError] = useState(false);
    const [sidebarStale, setSidebarStale] = useState(false);

    const refreshKey = useSettingsStore(s => s.malRefreshKey);
    const userWatching = useWatchingList(malUsername, enabled, { setMalLoading, setMalError, setMalSuccess, setMalStatus, setMalSavedAt, refreshKey });

    const [previewTrailer, setPreviewTrailer] = useState(null);
    const [previewPos, setPreviewPos] = useState({ x: 0, y: 0 });
    const [trailerMuted, setTrailerMuted] = useState(() => {
        const saved = safeStorage.getItem('dash_trailer_muted');
        return saved === null ? true : saved === 'true';
    });

    const sidebarRef = useRef(null);
    const toggleRef = useRef(null);
    const hoverTimer = useRef(null);
    const hideTimer = useRef(null);
    const trailerIframeRef = useRef(null);


    // Idle / Escape → close sidebar (disabled in always-open / embedded mode)
    useEffect(() => {
        if (alwaysOpen) return;
        const closeSidebar = () => setIsSidebarOpen(false);
        const handleKeyDown = (e) => { if (e.key === 'Escape') closeSidebar(); };
        window.addEventListener('app-idle', closeSidebar);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('app-idle', closeSidebar);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [alwaysOpen]);

    // Click-outside collapse for expanded card
    useEffect(() => {
        const handleCollapseClick = (e) => {
            if (expandedAnime &&
                !e.target.closest('.anime-card') &&
                !e.target.closest('.tab-item') &&
                !e.target.closest('.trailer-portal-container')) {
                setExpandedAnime(null);
            }
        };
        document.addEventListener('mousedown', handleCollapseClick);
        return () => document.removeEventListener('mousedown', handleCollapseClick);
    }, [expandedAnime]);

    // Check day rollover every minute and when window regains focus
    useEffect(() => {
        const checkDay = () => {
            const currentDay = getPortugalDayFilter();
            setTodayDay(prev => {
                if (prev !== currentDay) {
                    setActiveDay(currentDay);
                    return currentDay;
                }
                return prev;
            });
        };

        const interval = setInterval(checkDay, 60000);
        window.addEventListener('focus', checkDay);
        document.addEventListener('visibilitychange', checkDay);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', checkDay);
            document.removeEventListener('visibilitychange', checkDay);
        };
    }, []);

    // Schedule and watching are independent: a stalled provider cannot block both.
    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        let active = true;
        queueMicrotask(() => { if (active) { setTodayLoading(true); setTodayError(false); setTodayStale(false); } });
        fetchDaySchedule(todayDay, { signal: controller.signal }).then(data => {
            if (active) {
                setTodayStale(!!data?.stale);
                setTodayData([...new Map(data.filter(Boolean).map(item => [item.mal_id, item])).values()]);
            }
        }).catch(() => { if (active) setTodayError(true); })
            .finally(() => { if (active) setTodayLoading(false); });
        return () => { active = false; controller.abort(); };
    }, [todayDay, enabled]);

    useEffect(() => {
        const handleClickOutside = e => {
            if (!alwaysOpen && document.contains(e.target) && sidebarRef.current && !sidebarRef.current.contains(e.target)
                && toggleRef.current && !toggleRef.current.contains(e.target) && !e.target.closest('.trailer-portal-container')) setIsSidebarOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [alwaysOpen]);

    // Sidebar day change → fetch that day's schedule
    useEffect(() => {
        if (!enabled || (!isSidebarOpen && !alwaysOpen)) return;
        const controller = new AbortController();
        let isMounted = true;
        const loadSidebarData = async () => {
            setSidebarLoading(true);
            setSidebarError(false);
            setSidebarStale(false);
            try {
                const data = await fetchDaySchedule(activeDay, { signal: controller.signal });
                const uniqueSorted = Array.from(new Map(data.map(item => [item.mal_id, item])).values())
                    .filter(a => a.broadcast && a.broadcast.time)
                    .sort((a, b) => (a.airingAt || 0) - (b.airingAt || 0));
                if (isMounted) {
                    setSidebarStale(!!data?.stale);
                    setSidebarData(uniqueSorted);
                }
            } catch {
                if (isMounted) setSidebarError(true);
            } finally {
                if (isMounted) setSidebarLoading(false);
            }
        };
        loadSidebarData();
        return () => { isMounted = false; controller.abort(); };
    }, [activeDay, isSidebarOpen, alwaysOpen, enabled]);

    // Trailer: auto-unmute when a new trailer opens (if user preference is unmuted)
    useEffect(() => {
        if (!previewTrailer || trailerMuted || volume === 0) return;
        const timer = setTimeout(() => {
            const iframe = trailerIframeRef.current;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), 'https://www.youtube.com');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), 'https://www.youtube.com');
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [previewTrailer, trailerMuted, volume]);

    // Trailer: live volume sync
    useEffect(() => {
        if (!previewTrailer || trailerMuted) return;
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            if (volume === 0) {
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), 'https://www.youtube.com');
            } else {
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), 'https://www.youtube.com');
                iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), 'https://www.youtube.com');
            }
        }
    }, [volume, previewTrailer, trailerMuted]);

    // Derived: today display list (watching-prioritized top-5)
    const userWatchingIds = (() => {
        const ids = new Set(userWatching.map(u => Number(u.mal_id)).filter(id => !isNaN(id) && id > 0));
        return Array.from(ids);
    })();
    const displayList = (() => {
        if (!todayData || todayData.length === 0) return [];
        const watchedToday = todayData
            .filter(a => userWatchingIds.includes(Number(a.mal_id)))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        if (watchedToday.length >= 5) return watchedToday.slice(0, 5);
        const othersToday = todayData
            .filter(a => !userWatchingIds.includes(Number(a.mal_id)))
            .sort((a, b) => (b.score || 0) - (a.score || 0));
        return [...watchedToday, ...othersToday.slice(0, 5 - watchedToday.length)];
    })();

    useEffect(() => () => {
        clearTimeout(hoverTimer.current); clearTimeout(hideTimer.current);
    }, []);

    // Trailer hover handlers
    const handleMouseEnter = useCallback((e, anime) => {
        // Touch screens / mobile devices: do not show floating hover preview
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1024px)').matches) {
            return;
        }

        clearTimeout(hideTimer.current);
        const yid = extractTrailerId(anime);
        if (!yid) { setPreviewTrailer(null); return; }

        const rect = e.currentTarget.getBoundingClientRect();
        const isSidebar = e.currentTarget.closest('.anime-sidebar') !== null;
        const previewWidth = 300;
        const previewHeight = 169;
        let x, y;
        if (isSidebar) {
            x = rect.left - previewWidth - 20;
            if (x < 10) x = rect.right + 10;
        } else {
            x = rect.right + 20;
            if (x + previewWidth > window.innerWidth - 10) x = rect.left - previewWidth - 20;
        }
        y = rect.top + (rect.height / 2) - (previewHeight / 2);
        y = Math.max(10, Math.min(y, window.innerHeight - previewHeight - 10));
        x = Math.max(10, x);

        hoverTimer.current = setTimeout(() => {
            setPreviewTrailer(yid);
            setPreviewPos({ x, y });
        }, 400);
    }, []);

    const handleMouseLeave = useCallback(() => {
        clearTimeout(hoverTimer.current);
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);

    const handleTrailerMouseEnter = useCallback(() => clearTimeout(hideTimer.current), []);

    const handleTrailerMouseLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setPreviewTrailer(null), 300);
    }, []);

    const handleUnmute = useCallback(() => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), 'https://www.youtube.com');
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [Math.round(volume * 100)] }), 'https://www.youtube.com');
        }
        setTrailerMuted(false);
        safeStorage.setItem('dash_trailer_muted', 'false');
    }, [volume]);

    const handleMute = useCallback(() => {
        const iframe = trailerIframeRef.current;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), 'https://www.youtube.com');
        }
        setTrailerMuted(true);
        safeStorage.setItem('dash_trailer_muted', 'true');
    }, []);

    return {
        // sidebar
        isSidebarOpen, setIsSidebarOpen,
        activeDay, setActiveDay,
        sidebarData, sidebarLoading, sidebarError, sidebarStale,
        sidebarRef, toggleRef,
        // today list
        todayLoading, todayError, todayStale,
        displayList,
        userWatchingIds,
        // expand
        expandedAnime, setExpandedAnime,
        // trailer
        previewTrailer, previewPos,
        trailerMuted,
        trailerIframeRef,
        handleMouseEnter, handleMouseLeave,
        handleTrailerMouseEnter, handleTrailerMouseLeave,
        handleUnmute, handleMute,
    };
}
